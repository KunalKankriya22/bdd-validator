import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RegularOrderApiService } from './regular-order-api.service';
import { CreateRegularOrderRequestDto } from '../models/regular-order.model';
import { environment } from 'src/environments/environment';

describe('RegularOrderApiService', () => {
  let service: RegularOrderApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RegularOrderApiService]
    });
    service = TestBed.inject(RegularOrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });



  it('should get order items', () => {
    const mockResponse = {
      data: [
        { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
      ],
      success: true,
      message: 'OK',
      statusCode: 200,
      total: 1
    };

    service.getOrderItems('25001-0001').subscribe(result => {
      expect(result.length).toBe(1);
      expect(result[0].productType).toBe('RBC');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should add order item and return all items', () => {
    const dto = { itemNo: 2, productType: 'FFP', bloodType: 'O+', tier: 1, requiredQty: 3 };
    const mockResponse = {
      data: [
        { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 },
        { orderNo: '25001-0001', itemNo: 2, productType: 'FFP', bloodType: 'O+', tier: 1, requiredQty: 3, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 }
      ],
      success: true,
      message: 'Items retrieved successfully',
      statusCode: 200,
      total: 2
    };

    service.addOrderItem('25001-0001', dto).subscribe(result => {
      expect(result.length).toBe(2);
      expect(result[1].productType).toBe('FFP');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should delete order', () => {
    const mockResponse = {
      data: [true],
      success: true,
      message: 'Deleted',
      statusCode: 200,
      total: 0
    };

    service.deleteOrder('25001-0001').subscribe(result => {
      expect(result).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  describe('Change/Cancel Order endpoints', () => {
    it('should get order numbers lookup', () => {
      const mockResponse = {
        data: [
          { orderNo: '25001-0001', customerId: 'DAL-RG0001', customerName: 'Parkland Hospital', orderStatus: 'EN', insertDate: '2025-03-01' }
        ],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 1
      };

      service.getOrderNumbersLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].orderNo).toBe('25001-0001');
        expect(result[0].customerId).toBe('DAL-RG0001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-numbers`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get order numbers lookup with search param', () => {
      const mockResponse = {
        data: [
          { orderNo: '25001-0002', customerId: 'DAL-RG0002', customerName: 'Baylor Hospital', orderStatus: 'EN', insertDate: '2025-03-02' }
        ],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 1
      };

      service.getOrderNumbersLookup('Baylor').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].customerName).toBe('Baylor Hospital');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-numbers?search=Baylor`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get cancel codes lookup', () => {
      const mockResponse = {
        data: [
          { cancelCode: 'NN', description: 'No longer required' },
          { cancelCode: 'DU', description: 'Duplicate order' }
        ],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 2
      };

      service.getCancelCodesLookup().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('NN');
        expect(result[0].description).toBe('No longer required');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/cancel-codes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should cancel order', () => {
      const mockResponse = {
        data: [{ orderNo: '25001-0001', chapterId: 'DAL', customerId: 'DAL-RG0001', orderType: 'RG', orderClass: 'RG', orderStatus: 'CA', insertDate: '2025-03-01', insertUserId: 'admin', lastActivityDate: '2025-03-01', consigneeId: 'DAL-RG0001', payeeId: 'DAL-RG0001', items: [] }],
        success: true,
        message: 'Order canceled',
        statusCode: 200,
        total: 1
      };

      service.cancelOrder('25001-0001', { cancelCode: 'NN' }).subscribe(result => {
        expect(result.orderNo).toBe('25001-0001');
        expect(result.orderStatus).toBe('CA');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should cancel order item', () => {
      const mockResponse = {
        data: [
          { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'CA', allocatedQty: 0, shippedQty: 0 }
        ],
        success: true,
        message: 'Item canceled',
        statusCode: 200,
        total: 1
      };

      service.cancelOrderItem('25001-0001', 1).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].itemStatus).toBe('CA');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/1/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should update order item', () => {
      const mockResponse = {
        data: [
          { orderNo: '25001-0001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 5, itemStatus: 'OR', allocatedQty: 0, shippedQty: 0 }
        ],
        success: true,
        message: 'Item updated',
        statusCode: 200,
        total: 1
      };

      service.updateOrderItem('25001-0001', 1, { requiredQty: 5 }).subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].requiredQty).toBe(5);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  // ── Lookup endpoints ──

  describe('getCustomersLookup', () => {
    it('should get customers without search param', () => {
      const mockResponse = {
        data: [
          { customerId: 'DAL-RG0001', name: 'Parkland Hospital' }
        ]
      };

      service.getCustomersLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DAL-RG0001');
        expect(result[0].description).toBe('Parkland Hospital');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/customers`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get customers with search param', () => {
      const mockResponse = {
        data: [
          { customerId: 'DAL-RG0002', name: 'Baylor Hospital' }
        ]
      };

      service.getCustomersLookup('Baylor').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DAL-RG0002');
        expect(result[0].description).toBe('Baylor Hospital');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/customers?search=Baylor`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in search param', () => {
      const mockResponse = { data: [] };

      service.getCustomersLookup('test&foo').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/customers?search=test%26foo`);
      req.flush(mockResponse);
    });

    it('should map using fallback fields (code instead of customerId)', () => {
      const mockResponse = {
        data: [
          { code: 'C001', description: 'Customer One' }
        ]
      };

      service.getCustomersLookup().subscribe(result => {
        expect(result[0].code).toBe('C001');
        expect(result[0].description).toBe('Customer One');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/customers`);
      req.flush(mockResponse);
    });

    it('should handle response without data wrapper', () => {
      const mockResponse = [
        { customerId: 'C001', name: 'Hospital A' }
      ];

      service.getCustomersLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('C001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/customers`);
      req.flush(mockResponse);
    });

    it('should return empty array when data is not an array', () => {
      const mockResponse = { data: 'invalid' };

      service.getCustomersLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/customers`);
      req.flush(mockResponse);
    });

    it('should use customerId as description fallback', () => {
      const mockResponse = {
        data: [{ customerId: 'C001' }]
      };

      service.getCustomersLookup().subscribe(result => {
        expect(result[0].description).toBe('C001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/customers`);
      req.flush(mockResponse);
    });
  });

  describe('getCustomerById', () => {
    it('should get customer by id and extract data[0]', () => {
      const mockResponse = {
        data: [{ customerId: 'DAL-RG0001', name: 'Parkland Hospital' }]
      };

      service.getCustomerById('DAL-RG0001').subscribe(result => {
        expect(result.customerId).toBe('DAL-RG0001');
        expect(result.name).toBe('Parkland Hospital');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to data when data[0] is undefined', () => {
      const mockResponse = {
        data: { customerId: 'DAL-RG0001', name: 'Parkland Hospital' }
      };

      service.getCustomerById('DAL-RG0001').subscribe(result => {
        expect(result.customerId).toBe('DAL-RG0001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001`);
      req.flush(mockResponse);
    });

    it('should fall back to response when data is missing', () => {
      const mockResponse = { customerId: 'DAL-RG0001', name: 'Test' };

      service.getCustomerById('DAL-RG0001').subscribe(result => {
        expect(result.customerId).toBe('DAL-RG0001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001`);
      req.flush(mockResponse);
    });
  });

  describe('getConsignees', () => {
    it('should get consignees and map fields', () => {
      const mockResponse = {
        data: [
          { consigneeId: 'CON001', name: 'Main Campus', address: '123 Main St' }
        ]
      };

      service.getConsignees('DAL-RG0001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].consigneeId).toBe('CON001');
        expect(result[0].consigneeName).toBe('Main Campus');
        expect(result[0].address).toBe('123 Main St');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/consignees/DAL-RG0001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map using fallback field (code as consigneeId)', () => {
      const mockResponse = {
        data: [
          { code: 'CON002', consigneeName: 'Branch Campus' }
        ]
      };

      service.getConsignees('DAL-RG0001').subscribe(result => {
        expect(result[0].consigneeId).toBe('CON002');
        expect(result[0].consigneeName).toBe('Branch Campus');
        expect(result[0].address).toBe('');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/consignees/DAL-RG0001`);
      req.flush(mockResponse);
    });

    it('should return empty array when data is not an array', () => {
      const mockResponse = { data: null };

      service.getConsignees('DAL-RG0001').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/consignees/DAL-RG0001`);
      req.flush(mockResponse);
    });

    it('should handle response without data wrapper', () => {
      const mockResponse = [
        { consigneeId: 'CON001', name: 'Campus A', address: '456 Elm' }
      ];

      service.getConsignees('DAL-RG0001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].consigneeName).toBe('Campus A');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/consignees/DAL-RG0001`);
      req.flush(mockResponse);
    });
  });

  describe('getContacts', () => {
    it('should get contacts and map all fields', () => {
      const mockResponse = {
        data: [{
          contactType: 'PR',
          lastName: 'Smith',
          firstName: 'John',
          salutation: 'Mr',
          title: 'Director',
          dayPhoneNo: '555-1234',
          faxNo: '555-5678',
          nightPhoneNo: '555-9012',
          telexNo: '555-3456',
          effDate: '2025-01-01',
          termDate: '2026-12-31'
        }]
      };

      service.getContacts('DAL-RG0001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].contactId).toBe('PR');
        expect(result[0].lastName).toBe('Smith');
        expect(result[0].firstName).toBe('John');
        expect(result[0].salutation).toBe('Mr');
        expect(result[0].title).toBe('Director');
        expect(result[0].contactType).toBe('PR');
        expect(result[0].contactTypeCode).toBe('PR');
        expect(result[0].dayPhone).toBe('555-1234');
        expect(result[0].faxNumber).toBe('555-5678');
        expect(result[0].nightPhone).toBe('555-9012');
        expect(result[0].telexNumber).toBe('555-3456');
        expect(result[0].effectiveDate).toBe('2025-01-01');
        expect(result[0].terminationDate).toBe('2026-12-31');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001/contacts`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map using fallback fields (contactId, dayPhone, etc.)', () => {
      const mockResponse = {
        data: [{
          contactId: 'C01',
          lastName: 'Doe',
          firstName: 'Jane',
          dayPhone: '555-0001',
          faxNumber: '555-0002',
          nightPhone: '555-0003',
          telexNumber: '555-0004',
          effectiveDate: '2025-06-01',
          terminationDate: '2025-12-31'
        }]
      };

      service.getContacts('DAL-RG0001').subscribe(result => {
        expect(result[0].contactId).toBe('C01');
        expect(result[0].dayPhone).toBe('555-0001');
        expect(result[0].faxNumber).toBe('555-0002');
        expect(result[0].nightPhone).toBe('555-0003');
        expect(result[0].telexNumber).toBe('555-0004');
        expect(result[0].effectiveDate).toBe('2025-06-01');
        expect(result[0].terminationDate).toBe('2025-12-31');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001/contacts`);
      req.flush(mockResponse);
    });

    it('should return empty array when data is not an array', () => {
      const mockResponse = { data: 'invalid' };

      service.getContacts('DAL-RG0001').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001/contacts`);
      req.flush(mockResponse);
    });

    it('should default missing string fields to empty string', () => {
      const mockResponse = {
        data: [{}]
      };

      service.getContacts('DAL-RG0001').subscribe(result => {
        expect(result[0].contactId).toBe('');
        expect(result[0].lastName).toBe('');
        expect(result[0].firstName).toBe('');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001/contacts`);
      req.flush(mockResponse);
    });
  });

  describe('getContracts', () => {
    it('should get contracts and map fields', () => {
      const mockResponse = {
        data: [
          { code: 'CTR001', description: 'Annual Contract' }
        ]
      };

      service.getContracts('DAL-RG0001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('CTR001');
        expect(result[0].description).toBe('Annual Contract');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/contracts/DAL-RG0001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map using fallback field (contractId as code)', () => {
      const mockResponse = {
        data: [
          { contractId: 'CTR002' }
        ]
      };

      service.getContracts('DAL-RG0001').subscribe(result => {
        expect(result[0].code).toBe('CTR002');
        expect(result[0].description).toBe('CTR002');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/contracts/DAL-RG0001`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      const mockResponse = { data: {} };

      service.getContracts('DAL-RG0001').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/contracts/DAL-RG0001`);
      req.flush(mockResponse);
    });
  });

  describe('createContact', () => {
    it('should create a contact and return data[0]', () => {
      const contact = { lastName: 'Smith', firstName: 'John', contactType: 'PR' };
      const mockResponse = {
        data: [{ contactId: 'PR', lastName: 'Smith', firstName: 'John' }]
      };

      service.createContact('DAL-RG0001', contact).subscribe(result => {
        expect(result.contactId).toBe('PR');
        expect(result.lastName).toBe('Smith');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001/contacts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(contact);
      req.flush(mockResponse);
    });

    it('should fall back to item when data[0] is absent', () => {
      const contact = { lastName: 'Doe' };
      const mockResponse = { item: { contactId: 'C01', lastName: 'Doe' } };

      service.createContact('DAL-RG0001', contact).subscribe(result => {
        expect(result.contactId).toBe('C01');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001/contacts`);
      req.flush(mockResponse);
    });

    it('should fall back to response itself when data and item are absent', () => {
      const contact = { lastName: 'Test' };
      const mockResponse = { contactId: 'C02', lastName: 'Test' };

      service.createContact('DAL-RG0001', contact).subscribe(result => {
        expect(result.contactId).toBe('C02');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/DAL-RG0001/contacts`);
      req.flush(mockResponse);
    });
  });

  describe('getContactTypes', () => {
    it('should get contact types and map fields', () => {
      const mockResponse = {
        data: [
          { code: 'PR', description: 'Primary' },
          { code: 'SE', description: 'Secondary' }
        ]
      };

      service.getContactTypes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('PR');
        expect(result[0].description).toBe('Primary');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/dropdowns/contact-types`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map using fallback fields (contactTypeCode and contactType)', () => {
      const mockResponse = {
        data: [
          { contactTypeCode: 'PR', contactType: 'Primary Contact' }
        ]
      };

      service.getContactTypes().subscribe(result => {
        expect(result[0].code).toBe('PR');
        expect(result[0].description).toBe('Primary Contact');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/dropdowns/contact-types`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      const mockResponse = { data: null };

      service.getContactTypes().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/dropdowns/contact-types`);
      req.flush(mockResponse);
    });
  });

  describe('getProductTypesLookup', () => {
    it('should get product types and map using code/description', () => {
      const mockResponse = {
        data: [
          { code: 'RBC', description: 'Red Blood Cells' },
          { code: 'FFP', description: 'Fresh Frozen Plasma' }
        ]
      };

      service.getProductTypesLookup().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('RBC');
        expect(result[0].description).toBe('Red Blood Cells');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map using fallback fields (productType / productTypeDesc)', () => {
      const mockResponse = {
        data: [
          { productType: 'PLT', productTypeDesc: 'Platelets' }
        ]
      };

      service.getProductTypesLookup().subscribe(result => {
        expect(result[0].code).toBe('PLT');
        expect(result[0].description).toBe('Platelets');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types`);
      req.flush(mockResponse);
    });

    it('should use code as description fallback', () => {
      const mockResponse = {
        data: [{ code: 'WB' }]
      };

      service.getProductTypesLookup().subscribe(result => {
        expect(result[0].code).toBe('WB');
        expect(result[0].description).toBe('WB');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getProductTypesLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types`);
      req.flush({ data: 'not-array' });
    });
  });

  describe('getBloodTypesLookup', () => {
    it('should get blood types for a product type', () => {
      const mockResponse = {
        data: [
          { code: 'A+', description: 'A Positive' },
          { code: 'O-', description: 'O Negative' }
        ]
      };

      service.getBloodTypesLookup('RBC').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('A+');
        expect(result[0].description).toBe('A Positive');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/blood-types/RBC`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should map using fallback fields (aboCode / aboDesc)', () => {
      const mockResponse = {
        data: [
          { aboCode: 'B-', aboDesc: 'B Negative' }
        ]
      };

      service.getBloodTypesLookup('FFP').subscribe(result => {
        expect(result[0].code).toBe('B-');
        expect(result[0].description).toBe('B Negative');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/blood-types/FFP`);
      req.flush(mockResponse);
    });

    it('should use code as description fallback', () => {
      const mockResponse = { data: [{ code: 'AB+' }] };

      service.getBloodTypesLookup('PLT').subscribe(result => {
        expect(result[0].description).toBe('AB+');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/blood-types/PLT`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getBloodTypesLookup('RBC').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/blood-types/RBC`);
      req.flush({ data: null });
    });
  });

  describe('getOrderModesLookup', () => {
    it('should get order modes', () => {
      const mockResponse = {
        data: [
          { code: 'PH', description: 'Phone' },
          { code: 'FX', description: 'Fax' }
        ]
      };

      service.getOrderModesLookup().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('PH');
        expect(result[0].description).toBe('Phone');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-modes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use code as description fallback', () => {
      const mockResponse = { data: [{ code: 'EM' }] };

      service.getOrderModesLookup().subscribe(result => {
        expect(result[0].description).toBe('EM');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-modes`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getOrderModesLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-modes`);
      req.flush({ data: {} });
    });
  });

  describe('getTiersLookup', () => {
    it('should get tiers and map fields with formatted description', () => {
      const mockResponse = {
        data: [
          { tier: 1, dateRange: ' 0-7 days ', unitPrice: 150.00 },
          { tier: 2, dateRange: ' 8-14 days ', unitPrice: 120.00 }
        ]
      };

      service.getTiersLookup('RBC').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('1');
        expect(result[0].description).toBe('Tier 1 - 0-7 days ($150)');
        expect(result[0].unitPrice).toBe(150.00);
        expect(result[1].code).toBe('2');
        expect(result[1].description).toBe('Tier 2 - 8-14 days ($120)');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/tiers/RBC`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle missing dateRange', () => {
      const mockResponse = {
        data: [
          { tier: 3, unitPrice: 100.00 }
        ]
      };

      service.getTiersLookup('FFP').subscribe(result => {
        expect(result[0].code).toBe('3');
        expect(result[0].description).toBe('Tier 3 -  ($100)');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/tiers/FFP`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getTiersLookup('RBC').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/tiers/RBC`);
      req.flush({ data: 'invalid' });
    });

    it('should handle response without data wrapper', () => {
      const mockResponse = [
        { tier: 1, dateRange: '0-7 days', unitPrice: 200.00 }
      ];

      service.getTiersLookup('PLT').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].unitPrice).toBe(200.00);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/tiers/PLT`);
      req.flush(mockResponse);
    });
  });

  describe('getAttributeGroupsLookup', () => {
    it('should get attribute groups', () => {
      const mockResponse = {
        data: [
          { code: 'AG1', description: 'Attribute Group 1' }
        ]
      };

      service.getAttributeGroupsLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('AG1');
        expect(result[0].description).toBe('Attribute Group 1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/attribute-groups`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use code as description fallback', () => {
      const mockResponse = { data: [{ code: 'AG2' }] };

      service.getAttributeGroupsLookup().subscribe(result => {
        expect(result[0].description).toBe('AG2');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/attribute-groups`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getAttributeGroupsLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/attribute-groups`);
      req.flush({ data: null });
    });
  });

  describe('getAttributeCodesLookup', () => {
    it('should get attribute codes for a given group', () => {
      const mockResponse = {
        data: [
          { code: 'AC1', description: 'Attribute Code 1' },
          { code: 'AC2', description: 'Attribute Code 2' }
        ]
      };

      service.getAttributeCodesLookup('AG1').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('AC1');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/attribute-codes/AG1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use code as description fallback', () => {
      const mockResponse = { data: [{ code: 'AC3' }] };

      service.getAttributeCodesLookup('AG2').subscribe(result => {
        expect(result[0].description).toBe('AC3');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/attribute-codes/AG2`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getAttributeCodesLookup('AG1').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/attribute-codes/AG1`);
      req.flush({ data: 42 });
    });
  });

  describe('getOrderClassesLookup', () => {
    it('should get order classes', () => {
      const mockResponse = {
        data: [
          { code: 'RG', description: 'Regular' },
          { code: 'ST', description: 'Standing' }
        ]
      };

      service.getOrderClassesLookup().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('RG');
        expect(result[0].description).toBe('Regular');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-classes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use code as description fallback', () => {
      const mockResponse = { data: [{ code: 'EM' }] };

      service.getOrderClassesLookup().subscribe(result => {
        expect(result[0].description).toBe('EM');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-classes`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getOrderClassesLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-classes`);
      req.flush({ data: false });
    });
  });

  describe('getSalutationsLookup', () => {
    it('should get salutations', () => {
      const mockResponse = {
        data: [
          { code: 'MR', description: 'Mr.' },
          { code: 'MS', description: 'Ms.' }
        ]
      };

      service.getSalutationsLookup().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('MR');
        expect(result[0].description).toBe('Mr.');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/salutations`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use code as description fallback', () => {
      const mockResponse = { data: [{ code: 'DR' }] };

      service.getSalutationsLookup().subscribe(result => {
        expect(result[0].description).toBe('DR');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/salutations`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getSalutationsLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/salutations`);
      req.flush({ data: null });
    });
  });

  // ── Open Orders, Inventory, Charges, Notes ──

  describe('getOpenOrderItems', () => {
    it('should get open order items', () => {
      const mockResponse = {
        data: [
          { orderNumber: '25001-0001', item: 1, product: 'RBC', abORh: 'A+', quantityRequired: 5 }
        ]
      };

      service.getOpenOrderItems('DAL-RG0001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].orderNumber).toBe('25001-0001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/open-orders/DAL-RG0001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', () => {
      service.getOpenOrderItems('DAL-RG0001').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/open-orders/DAL-RG0001`);
      req.flush({});
    });
  });

  describe('getInventorySummary', () => {
    it('should get inventory summary', () => {
      const mockResponse = {
        data: [{ currentStock: 50, minimal: 10, optimal: 30 }]
      };

      service.getInventorySummary('RBC', 'A+').subscribe(result => {
        expect(result).toBeTruthy();
        expect(result.currentStock).toBe(50);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-summary?productType=RBC&bloodType=A+`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', () => {
      service.getInventorySummary('RBC', 'A+').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-summary?productType=RBC&bloodType=A+`);
      req.flush({ data: [] });
    });

    it('should return null when data is missing', () => {
      service.getInventorySummary('FFP', 'O-').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-summary?productType=FFP&bloodType=O-`);
      req.flush({});
    });
  });

  describe('getInventoryTiers', () => {
    it('should get inventory tiers', () => {
      const mockResponse = {
        data: [
          { tier: 1, stock: 20, avail: 15 },
          { tier: 2, stock: 10, avail: 8 }
        ]
      };

      service.getInventoryTiers('RBC', 'A+').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].tier).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-tiers?productType=RBC&bloodType=A+`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', () => {
      service.getInventoryTiers('RBC', 'A+').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-tiers?productType=RBC&bloodType=A+`);
      req.flush({});
    });
  });

  describe('checkInventoryStock', () => {
    it('should check inventory stock', () => {
      const mockResponse = {
        data: [{ currentStock: 50, minimal: 10, optimal: 30, requiredQty: 5, warningLevel: 'none', warningMessage: '' }]
      };

      service.checkInventoryStock('RBC', 'A+', 5).subscribe(result => {
        expect(result).toBeTruthy();
        expect(result!.currentStock).toBe(50);
        expect(result!.warningLevel).toBe('none');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-stock-check?productType=RBC&bloodType=A+&requiredQty=5`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', () => {
      service.checkInventoryStock('RBC', 'A+', 5).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-stock-check?productType=RBC&bloodType=A+&requiredQty=5`);
      req.flush({ data: [] });
    });

    it('should return null when data is missing', () => {
      service.checkInventoryStock('FFP', 'O-', 10).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/inventory-stock-check?productType=FFP&bloodType=O-&requiredQty=10`);
      req.flush({});
    });
  });

  describe('getOrderCharges', () => {
    it('should get order charges', () => {
      const mockResponse = {
        data: [
          { code: 'DLV', description: 'Delivery', amount: 25.00 }
        ]
      };

      service.getOrderCharges('25001-0001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DLV');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/charges`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', () => {
      service.getOrderCharges('25001-0001').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/charges`);
      req.flush({});
    });
  });

  describe('addOrderCharge', () => {
    it('should add an order charge', () => {
      const dto = { chargeCode: 'DLV', quantity: 1, amount: 25.00 };
      const mockResponse = { success: true, data: [dto] };

      service.addOrderCharge('25001-0001', dto).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/charges`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('deleteOrderCharge', () => {
    it('should delete an order charge and return true on success', () => {
      const mockResponse = { success: true };

      service.deleteOrderCharge('25001-0001', 'DLV').subscribe(result => {
        expect(result).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/charges/DLV`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should return false when success is false', () => {
      const mockResponse = { success: false };

      service.deleteOrderCharge('25001-0001', 'DLV').subscribe(result => {
        expect(result).toBeFalse();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/charges/DLV`);
      req.flush(mockResponse);
    });

    it('should return false when success is missing', () => {
      service.deleteOrderCharge('25001-0001', 'DLV').subscribe(result => {
        expect(result).toBeFalse();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/charges/DLV`);
      req.flush({});
    });
  });

  describe('getOrderNotes', () => {
    it('should get order notes', () => {
      const mockResponse = {
        data: [{ noteId: 1, note: 'Rush order' }]
      };

      service.getOrderNotes('25001-0001').subscribe(result => {
        expect(result).toBeTruthy();
        expect(result.note).toBe('Rush order');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/notes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', () => {
      service.getOrderNotes('25001-0001').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/notes`);
      req.flush({ data: [] });
    });

    it('should return null when data is missing', () => {
      service.getOrderNotes('25001-0001').subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/notes`);
      req.flush({});
    });
  });

  describe('saveOrderNotes', () => {
    it('should save order notes', () => {
      const mockResponse = { success: true };

      service.saveOrderNotes('25001-0001', 'Rush delivery needed').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/notes`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: 'Rush delivery needed' });
      req.flush(mockResponse);
    });
  });

  describe('getItemNotes', () => {
    it('should get item notes', () => {
      const mockResponse = {
        data: [{ noteId: 1, note: 'Special handling required' }]
      };

      service.getItemNotes('25001-0001', 1).subscribe(result => {
        expect(result).toBeTruthy();
        expect(result.note).toBe('Special handling required');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/1/notes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', () => {
      service.getItemNotes('25001-0001', 1).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/1/notes`);
      req.flush({ data: [] });
    });

    it('should return null when data is missing', () => {
      service.getItemNotes('25001-0001', 2).subscribe(result => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/2/notes`);
      req.flush({});
    });
  });

  describe('saveItemNotes', () => {
    it('should save item notes', () => {
      const mockResponse = { success: true };

      service.saveItemNotes('25001-0001', 1, 'Handle with care').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/1/notes`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: 'Handle with care' });
      req.flush(mockResponse);
    });
  });

  describe('getChargeCodesLookup', () => {
    it('should get charge codes and map all fields', () => {
      const mockResponse = {
        data: [
          { code: 'DLV', description: 'Delivery Charge', unitAmount: 25.00, crDbInd: 'D', percentDiscFlag: 'N' }
        ]
      };

      service.getChargeCodesLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DLV');
        expect(result[0].description).toBe('Delivery Charge');
        expect(result[0].unitAmount).toBe(25.00);
        expect(result[0].crDbInd).toBe('D');
        expect(result[0].percentDiscFlag).toBe('N');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/charge-codes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use defaults for missing optional fields', () => {
      const mockResponse = {
        data: [{ code: 'SPC' }]
      };

      service.getChargeCodesLookup().subscribe(result => {
        expect(result[0].code).toBe('SPC');
        expect(result[0].description).toBe('SPC');
        expect(result[0].unitAmount).toBe(0);
        expect(result[0].crDbInd).toBe('');
        expect(result[0].percentDiscFlag).toBe('');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/charge-codes`);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', () => {
      service.getChargeCodesLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/charge-codes`);
      req.flush({ data: 'not-array' });
    });

    it('should handle response without data wrapper', () => {
      const mockResponse = [
        { code: 'HAZ', description: 'Hazmat Fee', unitAmount: 50.00, crDbInd: 'D', percentDiscFlag: 'N' }
      ];

      service.getChargeCodesLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('HAZ');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/charge-codes`);
      req.flush(mockResponse);
    });
  });

  // ── Order CRUD ──

  describe('createOrder', () => {
    it('should create an order', () => {
      const dto: CreateRegularOrderRequestDto = {
        customerId: 'DAL-RG0001',
        orderType: 'RG',
        orderClass: 'RG',
        consigneeId: 'DAL-RG0001',
        payeeId: 'DAL-RG0001',
        items: []
      };
      const mockResponse = {
        data: [{
          orderNo: '25001-0003',
          chapterId: 'DAL',
          customerId: 'DAL-RG0001',
          orderType: 'RG',
          orderClass: 'RG',
          orderStatus: 'EN',
          insertDate: '2025-03-15',
          insertUserId: 'admin',
          lastActivityDate: '2025-03-15',
          consigneeId: 'DAL-RG0001',
          payeeId: 'DAL-RG0001',
          items: []
        }],
        success: true,
        message: 'Created',
        statusCode: 201,
        total: 1
      };

      service.createOrder(dto).subscribe(result => {
        expect(result.orderNo).toBe('25001-0003');
        expect(result.orderStatus).toBe('EN');
        expect(result.customerId).toBe('DAL-RG0001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('getOrder', () => {
    it('should get an order by order number', () => {
      const mockResponse = {
        data: [{
          orderNo: '25001-0001',
          chapterId: 'DAL',
          customerId: 'DAL-RG0001',
          orderType: 'RG',
          orderClass: 'RG',
          orderStatus: 'EN',
          insertDate: '2025-03-01',
          insertUserId: 'admin',
          lastActivityDate: '2025-03-01',
          consigneeId: 'DAL-RG0001',
          payeeId: 'DAL-RG0001',
          items: []
        }],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 1
      };

      service.getOrder('25001-0001').subscribe(result => {
        expect(result.orderNo).toBe('25001-0001');
        expect(result.customerId).toBe('DAL-RG0001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateOrder', () => {
    it('should update an order', () => {
      const dto = { orderedBy: 'Jane Doe', orderMode: 'PH' };
      const mockResponse = {
        data: [{
          orderNo: '25001-0001',
          chapterId: 'DAL',
          customerId: 'DAL-RG0001',
          orderType: 'RG',
          orderClass: 'RG',
          orderedBy: 'Jane Doe',
          orderMode: 'PH',
          orderStatus: 'EN',
          insertDate: '2025-03-01',
          insertUserId: 'admin',
          lastActivityDate: '2025-03-15',
          consigneeId: 'DAL-RG0001',
          payeeId: 'DAL-RG0001',
          items: []
        }],
        success: true,
        message: 'Updated',
        statusCode: 200,
        total: 1
      };

      service.updateOrder('25001-0001', dto).subscribe(result => {
        expect(result.orderNo).toBe('25001-0001');
        expect(result.orderedBy).toBe('Jane Doe');
        expect(result.orderMode).toBe('PH');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('getOpenOrders', () => {
    it('should get open orders with pagination and query', () => {
      const query = { customerId: 'DAL-RG0001', orderStatus: 'EN' };
      const mockResponse = {
        data: [{
          orderNo: '25001-0001',
          chapterId: 'DAL',
          customerId: 'DAL-RG0001',
          orderType: 'RG',
          orderClass: 'RG',
          orderStatus: 'EN',
          insertDate: '2025-03-01',
          insertUserId: 'admin',
          lastActivityDate: '2025-03-01',
          consigneeId: 'DAL-RG0001',
          payeeId: 'DAL-RG0001',
          items: []
        }],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 1
      };

      service.getOpenOrders(10, 0, query).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.success).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/10/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should handle empty results', () => {
      const query = { orderStatus: 'CA' };
      const mockResponse = {
        data: [],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 0
      };

      service.getOpenOrders(10, 0, query).subscribe(result => {
        expect(result.data.length).toBe(0);
        expect(result.total).toBe(0);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/10/0`);
      req.flush(mockResponse);
    });
  });

  describe('deleteOrderItem', () => {
    it('should delete an order item', () => {
      const mockResponse = {
        data: [true],
        success: true,
        message: 'Deleted',
        statusCode: 200,
        total: 0
      };

      service.deleteOrderItem('25001-0001', 1).subscribe(result => {
        expect(result).toBeTrue();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should return false when deletion fails', () => {
      const mockResponse = {
        data: [false],
        success: false,
        message: 'Failed',
        statusCode: 400,
        total: 0
      };

      service.deleteOrderItem('25001-0001', 2).subscribe(result => {
        expect(result).toBeFalse();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/items/2`);
      req.flush(mockResponse);
    });
  });

  describe('getPickSlips', () => {
    it('should get pick slips for an order', () => {
      const mockResponse = {
        data: [
          { pickSlipId: 'PS001', pickSlipType: 'STD', pickSlipStatus: 'PR', insertDate: '2025-03-10' },
          { pickSlipId: 'PS002', pickSlipType: 'STD', pickSlipStatus: 'CO', insertDate: '2025-03-11' }
        ],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 2
      };

      service.getPickSlips('25001-0001').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].pickSlipId).toBe('PS001');
        expect(result[1].pickSlipStatus).toBe('CO');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/pick-slips`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', () => {
      const mockResponse = {
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 0
      };

      service.getPickSlips('25001-0001').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/25001-0001/pick-slips`);
      req.flush(mockResponse);
    });
  });

  // ── Edge cases for Change/Cancel Order endpoints ──

  describe('getOrderNumbersLookup - edge cases', () => {
    it('should return empty array when data is not an array', () => {
      service.getOrderNumbersLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-numbers`);
      req.flush({ data: 'invalid' });
    });

    it('should handle response without data wrapper', () => {
      const mockResponse = [
        { orderNo: '25001-0001', customerId: 'C001', customerName: 'Hospital', orderStatus: 'EN', insertDate: '2025-01-01' }
      ];

      service.getOrderNumbersLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].orderNo).toBe('25001-0001');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-numbers`);
      req.flush(mockResponse);
    });

    it('should default missing fields to empty string', () => {
      const mockResponse = { data: [{}] };

      service.getOrderNumbersLookup().subscribe(result => {
        expect(result[0].orderNo).toBe('');
        expect(result[0].customerId).toBe('');
        expect(result[0].customerName).toBe('');
        expect(result[0].orderStatus).toBe('');
        expect(result[0].insertDate).toBe('');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-numbers`);
      req.flush(mockResponse);
    });

    it('should encode special characters in search for order numbers', () => {
      service.getOrderNumbersLookup('test&order').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-numbers?search=test%26order`);
      req.flush({ data: [] });
    });
  });

  describe('getCancelCodesLookup - edge cases', () => {
    it('should return empty array when data is not an array', () => {
      service.getCancelCodesLookup().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/cancel-codes`);
      req.flush({ data: null });
    });

    it('should map using fallback fields (code instead of cancelCode)', () => {
      const mockResponse = {
        data: [{ code: 'XX', description: 'Other reason' }]
      };

      service.getCancelCodesLookup().subscribe(result => {
        expect(result[0].code).toBe('XX');
        expect(result[0].description).toBe('Other reason');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/cancel-codes`);
      req.flush(mockResponse);
    });

    it('should use cancelCode as description fallback', () => {
      const mockResponse = {
        data: [{ cancelCode: 'ZZ' }]
      };

      service.getCancelCodesLookup().subscribe(result => {
        expect(result[0].code).toBe('ZZ');
        expect(result[0].description).toBe('ZZ');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/cancel-codes`);
      req.flush(mockResponse);
    });

    it('should default to empty string when both cancelCode and code are missing', () => {
      const mockResponse = { data: [{}] };

      service.getCancelCodesLookup().subscribe(result => {
        expect(result[0].code).toBe('');
        expect(result[0].description).toBe('');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/cancel-codes`);
      req.flush(mockResponse);
    });
  });

  // ── Service instantiation ──

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Gap-fix: getProductTypesLookup with customer/consignee params ──

  describe('getProductTypesLookup with params', () => {
    it('should pass customerId as query param', () => {
      const mockResponse = { data: [{ code: 'RBC', description: 'Red Blood Cells' }] };

      service.getProductTypesLookup('CUST1').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('RBC');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types?customerId=CUST1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass consigneeId as query param', () => {
      const mockResponse = { data: [{ code: 'PLT', description: 'Platelets' }] };

      service.getProductTypesLookup(undefined, 'CON1').subscribe(result => {
        expect(result.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types?consigneeId=CON1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass both customerId and consigneeId', () => {
      const mockResponse = { data: [{ code: 'FFP', description: 'Fresh Frozen Plasma' }] };

      service.getProductTypesLookup('CUST1', 'CON1').subscribe(result => {
        expect(result.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types?customerId=CUST1&consigneeId=CON1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should work without params (backward compatibility)', () => {
      const mockResponse = { data: [{ code: 'RBC', description: 'Red Blood Cells' }] };

      service.getProductTypesLookup().subscribe(result => {
        expect(result.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/product-types`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ── Gap-fix: getStandingOrderItems ──

  describe('getStandingOrderItems', () => {
    it('should call correct endpoint', () => {
      const mockResponse = {
        data: [
          { productType: 'RBC', bloodType: 'A+', requiredQty: 5, tier: 1 }
        ]
      };

      service.getStandingOrderItems('CUST1', 'CTR1').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].productType).toBe('RBC');
        expect(result[0].requiredQty).toBe(5);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/standing-order-items/CUST1/CTR1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass consigneeId as query param', () => {
      const mockResponse = { data: [{ productType: 'PLT', requiredQty: 3, tier: 1 }] };

      service.getStandingOrderItems('CUST1', 'CTR1', 'CON1').subscribe(result => {
        expect(result.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/standing-order-items/CUST1/CTR1?consigneeId=CON1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty response', () => {
      service.getStandingOrderItems('CUST1', 'CTR1').subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/standing-order-items/CUST1/CTR1`);
      req.flush({ data: [] });
    });
  });

  // ── Gap-fix: createConsignee ──

  describe('createConsignee', () => {
    it('should POST to /api/v1/consignee', () => {
      const consignee = { consigneeId: 'CON001', name: 'Main Campus' };
      const mockResponse = { data: [{ consigneeId: 'CON001', name: 'Main Campus', customerId: 'CUST1' }] };

      service.createConsignee('CUST1', consignee as any).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/consignee`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should include customerId in request body', () => {
      const consignee = { consigneeId: 'CON002', name: 'Branch Campus', address1: '123 Main St' };
      const mockResponse = { success: true };

      service.createConsignee('CUST1', consignee as any).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/consignee`);
      expect(req.request.body).toEqual(jasmine.objectContaining({
        customerId: 'CUST1',
        consigneeId: 'CON002',
        name: 'Branch Campus',
        address1: '123 Main St'
      }));
      req.flush(mockResponse);
    });
  });

  // ── Gap-fix: getContracts extended fields ──

  describe('getContracts - extended fields', () => {
    it('should return ContractLookupItem with substituteFlag', () => {
      const mockResponse = {
        data: [
          { code: 'CTR001', description: 'Annual Contract', substituteFlag: 'Y' }
        ]
      };

      service.getContracts('DAL-RG0001').subscribe(result => {
        expect(result[0].substituteFlag).toBe('Y');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/contracts/DAL-RG0001`);
      req.flush(mockResponse);
    });

    it('should return ContractLookupItem with effDate', () => {
      const mockResponse = {
        data: [
          { code: 'CTR001', description: 'Annual Contract', effDate: '2025-01-01' }
        ]
      };

      service.getContracts('DAL-RG0001').subscribe(result => {
        expect(result[0].effDate).toBe('2025-01-01');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/contracts/DAL-RG0001`);
      req.flush(mockResponse);
    });
  });

  // ── Gap-fix: getOrderClassesLookup extended fields ──

  describe('getOrderClassesLookup - extended fields', () => {
    it('should return OrderClassLookupItem with processHours', () => {
      const mockResponse = {
        data: [
          { code: 'RG', description: 'Regular', processHours: 24 }
        ]
      };

      service.getOrderClassesLookup().subscribe(result => {
        expect(result[0].processHours).toBe(24);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/regular-order/lookups/order-classes`);
      req.flush(mockResponse);
    });
  });
});
