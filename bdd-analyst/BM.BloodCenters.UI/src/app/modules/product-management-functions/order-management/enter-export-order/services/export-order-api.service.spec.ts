import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ExportOrderApiService } from './export-order-api.service';
import { environment } from 'src/environments/environment';

describe('ExportOrderApiService', () => {
  let service: ExportOrderApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ExportOrderApiService]
    });
    service = TestBed.inject(ExportOrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // Simple code/description lookup endpoints
  // All follow the same pattern: GET -> unwrap response.data -> map to LookupItem[]
  // ---------------------------------------------------------------------------
  describe('simple code/description lookup endpoints', () => {
    const simpleLookups: Array<{
      name: string;
      call: () => any;
      expectedUrl: string;
      mockItem: any;
      codePath: string;
      descPath: string;
    }> = [
      {
        name: 'getContactTypes',
        call: () => service.getContactTypes(),
        expectedUrl: `${environment.apiUrl}/api/v1/customer-profile/dropdowns/contact-types`,
        mockItem: { code: 'PR', description: 'Primary' },
        codePath: 'code',
        descPath: 'description'
      },
      {
        name: 'getProductTypesLookup',
        call: () => service.getProductTypesLookup(),
        expectedUrl: `${environment.apiUrl}/api/v1/export-orders/lookups/product-types`,
        mockItem: { code: 'RBC', description: 'Red Blood Cells' },
        codePath: 'code',
        descPath: 'description'
      },
      {
        name: 'getBloodTypesLookup',
        call: () => service.getBloodTypesLookup('RBC'),
        expectedUrl: `${environment.apiUrl}/api/v1/export-orders/lookups/blood-types/RBC`,
        mockItem: { code: 'A+', description: 'A Positive' },
        codePath: 'code',
        descPath: 'description'
      },
      {
        name: 'getOrderModesLookup',
        call: () => service.getOrderModesLookup(),
        expectedUrl: `${environment.apiUrl}/api/v1/export-orders/lookups/order-modes`,
        mockItem: { code: 'ST', description: 'Standard' },
        codePath: 'code',
        descPath: 'description'
      },
      {
        name: 'getAttributeGroupsLookup',
        call: () => service.getAttributeGroupsLookup(),
        expectedUrl: `${environment.apiUrl}/api/v1/export-orders/lookups/attribute-groups`,
        mockItem: { code: 'ABO', description: 'ABO Group' },
        codePath: 'code',
        descPath: 'description'
      },
      {
        name: 'getAttributeCodesLookup',
        call: () => service.getAttributeCodesLookup('ABO'),
        expectedUrl: `${environment.apiUrl}/api/v1/export-orders/lookups/attribute-codes/ABO`,
        mockItem: { code: 'AP', description: 'A Positive' },
        codePath: 'code',
        descPath: 'description'
      },
      {
        name: 'getOrderClassesLookup',
        call: () => service.getOrderClassesLookup(),
        expectedUrl: `${environment.apiUrl}/api/v1/export-orders/lookups/order-classes`,
        mockItem: { code: 'RG', description: 'Regular' },
        codePath: 'code',
        descPath: 'description'
      },
      {
        name: 'getSalutationsLookup',
        call: () => service.getSalutationsLookup(),
        expectedUrl: `${environment.apiUrl}/api/v1/export-orders/lookups/salutations`,
        mockItem: { code: 'MR', description: 'Mr.' },
        codePath: 'code',
        descPath: 'description'
      }
    ];

    simpleLookups.forEach(({ name, call, expectedUrl, mockItem, codePath, descPath }) => {
      it(`${name} should send GET and map response.data to LookupItem[]`, (done) => {
        // Arrange
        const mockResponse = { data: [mockItem], success: true };

        // Act
        call().subscribe((result: any[]) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].code).toBe(mockItem[codePath]);
          expect(result[0].description).toBe(mockItem[descPath]);
          done();
        });

        const req = httpMock.expectOne(expectedUrl);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
      });

      it(`${name} should return empty array when data is not an array`, (done) => {
        // Arrange
        const mockResponse = { data: 'not-an-array' };

        // Act
        call().subscribe((result: any[]) => {
          // Assert
          expect(result).toEqual([]);
          done();
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush(mockResponse);
      });

      it(`${name} should fall back to response itself when data is missing`, (done) => {
        // Arrange - response without .data wrapper; the array IS the response
        const mockResponse = [mockItem];

        // Act
        call().subscribe((result: any[]) => {
          // Assert
          expect(result.length).toBe(1);
          done();
        });

        const req = httpMock.expectOne(expectedUrl);
        req.flush(mockResponse);
      });
    });

    // Thorough mapping-logic test: code/description fallback for a representative method
    it('getProductTypesLookup should fall back to alternate field names', (done) => {
      const mockResponse = {
        data: [{ productType: 'PLT', productTypeDesc: 'Platelets' }]
      };

      service.getProductTypesLookup().subscribe((result) => {
        expect(result[0].code).toBe('PLT');
        expect(result[0].description).toBe('Platelets');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/product-types`
      );
      req.flush(mockResponse);
    });

    it('getBloodTypesLookup should fall back to aboCode / aboDesc', (done) => {
      const mockResponse = {
        data: [{ aboCode: 'O-', aboDesc: 'O Negative' }]
      };

      service.getBloodTypesLookup('RBC').subscribe((result) => {
        expect(result[0].code).toBe('O-');
        expect(result[0].description).toBe('O Negative');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/blood-types/RBC`
      );
      req.flush(mockResponse);
    });

    it('getContactTypes should fall back to contactTypeCode / contactType', (done) => {
      const mockResponse = {
        data: [{ contactTypeCode: 'EM', contactType: 'Emergency' }]
      };

      service.getContactTypes().subscribe((result) => {
        expect(result[0].code).toBe('EM');
        expect(result[0].description).toBe('Emergency');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/customer-profile/dropdowns/contact-types`
      );
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // Customers lookup
  // ---------------------------------------------------------------------------
  describe('getCustomersLookup', () => {
    const baseCustomerUrl = `${environment.apiUrl}/api/v1/export-orders/lookups/customers`;

    it('should send GET without query param when no search provided', (done) => {
      const mockResponse = {
        data: [{ customerId: 'CUST001', name: 'Parkland Hospital' }]
      };

      service.getCustomersLookup().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('CUST001');
        expect(result[0].description).toBe('Parkland Hospital');
        done();
      });

      const req = httpMock.expectOne(baseCustomerUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should append encoded search param when search is provided', (done) => {
      const mockResponse = {
        data: [{ customerId: 'CUST002', name: 'Baylor Hospital' }]
      };

      service.getCustomersLookup('Baylor').subscribe((result) => {
        expect(result[0].code).toBe('CUST002');
        expect(result[0].description).toBe('Baylor Hospital');
        done();
      });

      const req = httpMock.expectOne(`${baseCustomerUrl}?search=Baylor`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to code/description fields', (done) => {
      const mockResponse = {
        data: [{ code: 'C003', description: 'Some Hospital' }]
      };

      service.getCustomersLookup().subscribe((result) => {
        expect(result[0].code).toBe('C003');
        expect(result[0].description).toBe('Some Hospital');
        done();
      });

      const req = httpMock.expectOne(baseCustomerUrl);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done) => {
      service.getCustomersLookup().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(baseCustomerUrl);
      req.flush({ data: null });
    });
  });

  // ---------------------------------------------------------------------------
  // getCustomerById
  // ---------------------------------------------------------------------------
  describe('getCustomerById', () => {
    it('should send GET and unwrap data[0]', (done) => {
      const customer = { customerId: 'CUST001', name: 'Parkland Hospital' };
      const mockResponse = { data: [customer] };

      service.getCustomerById('CUST001').subscribe((result) => {
        expect(result.customerId).toBe('CUST001');
        expect(result.name).toBe('Parkland Hospital');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/CUST001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to data when data[0] is undefined', (done) => {
      const mockResponse = { data: { customerId: 'CUST001' } };

      service.getCustomerById('CUST001').subscribe((result) => {
        expect(result.customerId).toBe('CUST001');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/CUST001`);
      req.flush(mockResponse);
    });

    it('should fall back to response itself when data is missing', (done) => {
      const mockResponse = { customerId: 'CUST001' };

      service.getCustomerById('CUST001').subscribe((result) => {
        expect(result.customerId).toBe('CUST001');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/customer-profile/CUST001`);
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getConsignees
  // ---------------------------------------------------------------------------
  describe('getConsignees', () => {
    const consigneesUrl = `${environment.apiUrl}/api/v1/export-orders/lookups/consignees/CUST001`;

    it('should send GET and map to ConsigneeDto[]', (done) => {
      const mockResponse = {
        data: [{ consigneeId: 'CON001', name: 'Lab A', address: '123 Main St' }]
      };

      service.getConsignees('CUST001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].consigneeId).toBe('CON001');
        expect(result[0].consigneeName).toBe('Lab A');
        expect(result[0].address).toBe('123 Main St');
        done();
      });

      const req = httpMock.expectOne(consigneesUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to code/consigneeName fields', (done) => {
      const mockResponse = {
        data: [{ code: 'CON002', consigneeName: 'Lab B', address: '' }]
      };

      service.getConsignees('CUST001').subscribe((result) => {
        expect(result[0].consigneeId).toBe('CON002');
        expect(result[0].consigneeName).toBe('Lab B');
        done();
      });

      const req = httpMock.expectOne(consigneesUrl);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done) => {
      service.getConsignees('CUST001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(consigneesUrl);
      req.flush({ data: 'invalid' });
    });
  });

  // ---------------------------------------------------------------------------
  // getContacts
  // ---------------------------------------------------------------------------
  describe('getContacts', () => {
    const contactsUrl = `${environment.apiUrl}/api/v1/customer-profile/CUST001/contacts`;

    it('should send GET and map to CustomerContactDto[]', (done) => {
      const mockResponse = {
        data: [{
          contactType: 'PR',
          lastName: 'Smith',
          firstName: 'John',
          salutation: 'Dr',
          title: 'Director',
          dayPhoneNo: '555-1234',
          faxNo: '555-5678',
          nightPhoneNo: '555-9999',
          telexNo: '555-0000',
          effDate: '2024-01-01',
          termDate: '2025-12-31'
        }]
      };

      service.getContacts('CUST001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].contactId).toBe('PR');
        expect(result[0].lastName).toBe('Smith');
        expect(result[0].firstName).toBe('John');
        expect(result[0].salutation).toBe('Dr');
        expect(result[0].title).toBe('Director');
        expect(result[0].contactType).toBe('PR');
        expect(result[0].contactTypeCode).toBe('PR');
        expect(result[0].dayPhone).toBe('555-1234');
        expect(result[0].faxNumber).toBe('555-5678');
        expect(result[0].nightPhone).toBe('555-9999');
        expect(result[0].telexNumber).toBe('555-0000');
        expect(result[0].effectiveDate).toBe('2024-01-01');
        expect(result[0].terminationDate).toBe('2025-12-31');
        done();
      });

      const req = httpMock.expectOne(contactsUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle alternate field names for phone/date fields', (done) => {
      const mockResponse = {
        data: [{
          contactId: 'EM',
          lastName: 'Doe',
          firstName: 'Jane',
          dayPhone: '111-2222',
          faxNumber: '333-4444',
          nightPhone: '555-6666',
          telexNumber: '777-8888',
          effectiveDate: '2024-06-01',
          terminationDate: '2025-06-01'
        }]
      };

      service.getContacts('CUST001').subscribe((result) => {
        expect(result[0].dayPhone).toBe('111-2222');
        expect(result[0].faxNumber).toBe('333-4444');
        expect(result[0].nightPhone).toBe('555-6666');
        expect(result[0].telexNumber).toBe('777-8888');
        expect(result[0].effectiveDate).toBe('2024-06-01');
        expect(result[0].terminationDate).toBe('2025-06-01');
        done();
      });

      const req = httpMock.expectOne(contactsUrl);
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done) => {
      service.getContacts('CUST001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(contactsUrl);
      req.flush({ data: null });
    });
  });

  // ---------------------------------------------------------------------------
  // getContracts
  // ---------------------------------------------------------------------------
  describe('getContracts', () => {
    it('should send GET and map to LookupItem[]', (done) => {
      const mockResponse = {
        data: [{ code: 'CTR001', description: 'Annual Contract' }]
      };

      service.getContracts('CUST001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('CTR001');
        expect(result[0].description).toBe('Annual Contract');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/contracts/CUST001`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to contractId fields', (done) => {
      const mockResponse = {
        data: [{ contractId: 'CTR002' }]
      };

      service.getContracts('CUST001').subscribe((result) => {
        expect(result[0].code).toBe('CTR002');
        expect(result[0].description).toBe('CTR002');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/contracts/CUST001`
      );
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getTiersLookup — has special template-string description
  // ---------------------------------------------------------------------------
  describe('getTiersLookup', () => {
    it('should send GET and build description with template string', (done) => {
      const mockResponse = {
        data: [{ tier: 1, dateRange: ' 0-7 days ', unitPrice: 125.00 }]
      };

      service.getTiersLookup('RBC').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('1');
        expect(result[0].description).toBe('Tier 1 - 0-7 days ($125)');
        expect(result[0].unitPrice).toBe(125.00);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/tiers/RBC`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle missing dateRange gracefully', (done) => {
      const mockResponse = {
        data: [{ tier: 2, unitPrice: 95.50 }]
      };

      service.getTiersLookup('PLT').subscribe((result) => {
        expect(result[0].code).toBe('2');
        expect(result[0].description).toBe('Tier 2 -  ($95.5)');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/tiers/PLT`
      );
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done) => {
      service.getTiersLookup('RBC').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/tiers/RBC`
      );
      req.flush({ data: 'invalid' });
    });
  });

  // ---------------------------------------------------------------------------
  // getChargeCodesLookup — maps extra fields (unitAmount, crDbInd, percentDiscFlag)
  // ---------------------------------------------------------------------------
  describe('getChargeCodesLookup', () => {
    it('should send GET and map all charge code fields', (done) => {
      const mockResponse = {
        data: [{
          code: 'DL',
          description: 'Delivery Charge',
          unitAmount: 15.00,
          crDbInd: 'D',
          percentDiscFlag: 'N'
        }]
      };

      service.getChargeCodesLookup().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('DL');
        expect(result[0].description).toBe('Delivery Charge');
        expect(result[0].unitAmount).toBe(15.00);
        expect(result[0].crDbInd).toBe('D');
        expect(result[0].percentDiscFlag).toBe('N');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/charge-codes`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should default missing fields', (done) => {
      const mockResponse = { data: [{ code: 'TX' }] };

      service.getChargeCodesLookup().subscribe((result) => {
        expect(result[0].description).toBe('TX');
        expect(result[0].unitAmount).toBe(0);
        expect(result[0].crDbInd).toBe('');
        expect(result[0].percentDiscFlag).toBe('');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/charge-codes`
      );
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done) => {
      service.getChargeCodesLookup().subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/charge-codes`
      );
      req.flush({ data: null });
    });
  });

  // ---------------------------------------------------------------------------
  // createContact
  // ---------------------------------------------------------------------------
  describe('createContact', () => {
    const contactUrl = `${environment.apiUrl}/api/v1/customer-profile/CUST001/contacts`;

    it('should send POST with contact body and unwrap data[0]', (done) => {
      const contact = { lastName: 'Smith', firstName: 'John', contactType: 'PR' };
      const created = { contactId: 'PR', lastName: 'Smith', firstName: 'John' };
      const mockResponse = { data: [created] };

      service.createContact('CUST001', contact).subscribe((result) => {
        expect(result.contactId).toBe('PR');
        expect(result.lastName).toBe('Smith');
        done();
      });

      const req = httpMock.expectOne(contactUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(contact);
      req.flush(mockResponse);
    });

    it('should fall back to response.item', (done) => {
      const contact = { lastName: 'Doe' };
      const mockResponse = { item: { contactId: 'EM' } };

      service.createContact('CUST001', contact).subscribe((result) => {
        expect(result.contactId).toBe('EM');
        done();
      });

      const req = httpMock.expectOne(contactUrl);
      req.flush(mockResponse);
    });

    it('should fall back to response itself when data and item are missing', (done) => {
      const contact = { lastName: 'Doe' };
      const mockResponse = { contactId: 'FA' };

      service.createContact('CUST001', contact).subscribe((result) => {
        expect(result.contactId).toBe('FA');
        done();
      });

      const req = httpMock.expectOne(contactUrl);
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // Order CRUD (export order endpoints)
  // ---------------------------------------------------------------------------
  describe('Order CRUD', () => {
    const orderUrl = `${environment.apiUrl}/api/v1/export-orders`;
    const orderNo = 'EX25001-0001';

    it('createOrder should send POST and return data[0]', (done) => {
      const dto: any = {
        customerId: 'CUST001',
        orderType: 'EX',
        orderClass: 'EX',
        consigneeId: 'CON001',
        payeeId: 'PAY001',
        items: []
      };
      const created = { orderNo, customerId: 'CUST001', insertDate: '2025-03-01', insertUserId: 'admin' };
      const mockResponse = { data: [created], success: true, message: 'OK', statusCode: 200, total: 1 };

      service.createOrder(dto).subscribe((result) => {
        expect(result.orderNo).toBe(orderNo);
        expect(result.customerId).toBe('CUST001');
        done();
      });

      const req = httpMock.expectOne(orderUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('getOrder should send GET and return data[0]', (done) => {
      const order = { orderNo, customerId: 'CUST001', insertDate: '2025-03-01', insertUserId: 'admin' };
      const mockResponse = { data: [order], success: true, message: 'OK', statusCode: 200, total: 1 };

      service.getOrder(orderNo).subscribe((result) => {
        expect(result.orderNo).toBe(orderNo);
        done();
      });

      const req = httpMock.expectOne(`${orderUrl}/${orderNo}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('updateOrder should send PUT and return data[0]', (done) => {
      const dto: any = { orderedBy: 'Dr. Smith', orderMode: 'ST' };
      const updated = { orderNo, orderedBy: 'Dr. Smith' };
      const mockResponse = { data: [updated], success: true };

      service.updateOrder(orderNo, dto).subscribe((result) => {
        expect(result.orderedBy).toBe('Dr. Smith');
        done();
      });

      const req = httpMock.expectOne(`${orderUrl}/${orderNo}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('updateOrder should fall back to response when data is missing', (done) => {
      const dto: any = { orderedBy: 'Dr. Smith' };
      const mockResponse = { success: true, orderNo };

      service.updateOrder(orderNo, dto).subscribe((result) => {
        expect(result.orderNo).toBe(orderNo);
        done();
      });

      const req = httpMock.expectOne(`${orderUrl}/${orderNo}`);
      req.flush(mockResponse);
    });

    it('deleteOrder should send DELETE and return success flag', (done) => {
      const mockResponse = { data: [true], success: true, message: 'Deleted', statusCode: 200, total: 0 };

      service.deleteOrder(orderNo).subscribe((result) => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${orderUrl}/${orderNo}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // Order Items (export order endpoints)
  // ---------------------------------------------------------------------------
  describe('Order Items', () => {
    const orderNo = 'EX25001-0001';
    const itemsUrl = `${environment.apiUrl}/api/v1/export-orders/${orderNo}/items`;

    it('getOrderItems should send GET and return data array', (done) => {
      const mockResponse = {
        data: [
          { orderNo, itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
        ],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 1
      };

      service.getOrderItems(orderNo).subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].productType).toBe('RBC');
        expect(result[0].requiredQty).toBe(2);
        done();
      });

      const req = httpMock.expectOne(itemsUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('addOrderItem should send POST and return data array', (done) => {
      const dto: any = { itemNo: 2, productType: 'FFP', bloodType: 'O+', tier: 1, requiredQty: 3 };
      const mockResponse = {
        data: [
          { orderNo, itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 },
          { orderNo, itemNo: 2, productType: 'FFP', bloodType: 'O+', tier: 1, requiredQty: 3, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
        ],
        success: true,
        message: 'OK',
        statusCode: 200,
        total: 2
      };

      service.addOrderItem(orderNo, dto).subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[1].productType).toBe('FFP');
        done();
      });

      const req = httpMock.expectOne(itemsUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('deleteOrderItem should send DELETE and return success flag', (done) => {
      const mockResponse = { data: [true], success: true, message: 'Deleted', statusCode: 200, total: 0 };

      service.deleteOrderItem(orderNo, 1).subscribe((result) => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${itemsUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // Open Orders, Inventory, Charges, Notes
  // ---------------------------------------------------------------------------
  describe('getOpenOrderItems', () => {
    it('should send GET and return data array', (done) => {
      const mockResponse = { data: [{ orderNo: 'EX25001-0001', itemNo: 1 }] };

      service.getOpenOrderItems('CUST001').subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].orderNo).toBe('EX25001-0001');
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/open-orders/CUST001`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', (done) => {
      service.getOpenOrderItems('CUST001').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/open-orders/CUST001`
      );
      req.flush({});
    });
  });

  describe('getInventorySummary', () => {
    const inventoryUrl = `${environment.apiUrl}/api/v1/export-orders/lookups/inventory-summary?productType=RBC&bloodType=A%2B`;

    it('should send GET and return data[0]', (done) => {
      const summary = { productType: 'RBC', bloodType: 'A+', availableQty: 50 };
      const mockResponse = { data: [summary] };

      service.getInventorySummary('RBC', 'A+').subscribe((result) => {
        expect(result.availableQty).toBe(50);
        done();
      });

      // The + in A+ is sent literally in the URL since the service builds it via template string
      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/inventory-summary?productType=RBC&bloodType=A+`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', (done) => {
      service.getInventorySummary('RBC', 'A+').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/inventory-summary?productType=RBC&bloodType=A+`
      );
      req.flush({ data: [] });
    });
  });

  describe('getInventoryTiers', () => {
    it('should send GET and return data array', (done) => {
      const mockResponse = {
        data: [{ tier: 1, availableQty: 30 }, { tier: 2, availableQty: 20 }]
      };

      service.getInventoryTiers('RBC', 'O-').subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].tier).toBe(1);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/inventory-tiers?productType=RBC&bloodType=O-`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is missing', (done) => {
      service.getInventoryTiers('RBC', 'O-').subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/inventory-tiers?productType=RBC&bloodType=O-`
      );
      req.flush({});
    });
  });

  describe('checkInventoryStock', () => {
    it('should send GET and return data[0]', (done) => {
      const stockResult = { available: true, availableQty: 10 };
      const mockResponse = { data: [stockResult] };

      service.checkInventoryStock('RBC', 'A+', 5).subscribe((result) => {
        expect(result).toBeTruthy();
        expect(result!.availableQty).toBe(10);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/inventory-stock-check?productType=RBC&bloodType=A+&requiredQty=5`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', (done) => {
      service.checkInventoryStock('RBC', 'A+', 5).subscribe((result) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/export-orders/lookups/inventory-stock-check?productType=RBC&bloodType=A+&requiredQty=5`
      );
      req.flush({ data: [] });
    });
  });

  describe('Order Charges', () => {
    const orderNo = 'EX25001-0001';
    const chargesUrl = `${environment.apiUrl}/api/v1/export-orders/${orderNo}/charges`;

    it('getOrderCharges should send GET and return data array', (done) => {
      const mockResponse = { data: [{ chargeCode: 'DL', amount: 15.00 }] };

      service.getOrderCharges(orderNo).subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].chargeCode).toBe('DL');
        done();
      });

      const req = httpMock.expectOne(chargesUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('getOrderCharges should return empty array when data is missing', (done) => {
      service.getOrderCharges(orderNo).subscribe((result) => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(chargesUrl);
      req.flush({});
    });

    it('addOrderCharge should send POST with dto body', (done) => {
      const dto = { chargeCode: 'DL', quantity: 1 };
      const mockResponse = { success: true };

      service.addOrderCharge(orderNo, dto).subscribe((result) => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(chargesUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('deleteOrderCharge should send DELETE and return success flag', (done) => {
      const mockResponse = { success: true };

      service.deleteOrderCharge(orderNo, 'DL').subscribe((result) => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(`${chargesUrl}/DL`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('deleteOrderCharge should return false when success is missing', (done) => {
      service.deleteOrderCharge(orderNo, 'DL').subscribe((result) => {
        expect(result).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(`${chargesUrl}/DL`);
      req.flush({});
    });
  });

  describe('Order Notes', () => {
    const orderNo = 'EX25001-0001';
    const notesUrl = `${environment.apiUrl}/api/v1/export-orders/${orderNo}/notes`;

    it('getOrderNotes should send GET and return data[0]', (done) => {
      const note = { noteId: 1, noteText: 'Handle with care' };
      const mockResponse = { data: [note] };

      service.getOrderNotes(orderNo).subscribe((result: any) => {
        expect(result.noteId).toBe(1);
        expect(result.noteText).toBe('Handle with care');
        done();
      });

      const req = httpMock.expectOne(notesUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('getOrderNotes should return null when data is empty', (done) => {
      service.getOrderNotes(orderNo).subscribe((result: any) => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(notesUrl);
      req.flush({ data: [] });
    });

    it('saveOrderNotes should send PUT with note in body', (done) => {
      const mockResponse = { success: true };

      service.saveOrderNotes(orderNo, 'Rush delivery').subscribe((result) => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(notesUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: 'Rush delivery' });
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getPayeesLookup
  // ---------------------------------------------------------------------------
  describe('getPayeesLookup', () => {
    it('should send GET and map payee data', (done) => {
      const mockResponse = { data: [{ customerId: 'P1', name: 'Payee One', address: '123 Main St' }] };
      service.getPayeesLookup('CUST1').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('P1');
        expect(result[0].description).toBe('Payee One');
        expect(result[0].address).toBe('123 Main St');
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/payees/CUST1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array for empty response', (done) => {
      service.getPayeesLookup('CUST1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/payees/CUST1'));
      req.flush({ data: [] });
    });

    it('should return empty array for non-array data', (done) => {
      service.getPayeesLookup('CUST1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/payees/CUST1'));
      req.flush({ data: 'invalid' });
    });
  });

  // ---------------------------------------------------------------------------
  // getStandingOrderItems
  // ---------------------------------------------------------------------------
  describe('getStandingOrderItems', () => {
    it('should send GET with customerId and contractId', (done) => {
      const mockResponse = { data: [{ productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 5 }] };
      service.getStandingOrderItems('CUST1', 'CON1').subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/standing-order-items/CUST1/CON1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should include consigneeId query param when provided', (done) => {
      service.getStandingOrderItems('CUST1', 'CON1', 'CONS1').subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('consigneeId=CONS1'));
      req.flush({ data: [] });
    });

    it('should return empty array when data is missing', (done) => {
      service.getStandingOrderItems('CUST1', 'CON1').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/standing-order-items/CUST1/CON1'));
      req.flush({});
    });
  });

  // ---------------------------------------------------------------------------
  // getProductTypesLookup with params
  // ---------------------------------------------------------------------------
  describe('getProductTypesLookup with params', () => {
    it('should include customerId and consigneeId in query string', (done) => {
      service.getProductTypesLookup('CUST1', 'CONS1').subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('customerId=CUST1') && r.url.includes('consigneeId=CONS1'));
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });

    it('should work without params', (done) => {
      service.getProductTypesLookup().subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/product-types') && !r.url.includes('customerId'));
      req.flush({ data: [] });
    });
  });

  // ---------------------------------------------------------------------------
  // getTiersLookup with customerId
  // ---------------------------------------------------------------------------
  describe('getTiersLookup with customerId', () => {
    it('should include customerId in query string', (done) => {
      service.getTiersLookup('RBC', 'CUST1').subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/tiers/RBC') && r.url.includes('customerId=CUST1'));
      req.flush({ data: [] });
    });
  });

  // ---------------------------------------------------------------------------
  // getOrderClassesLookup returns processHours
  // ---------------------------------------------------------------------------
  describe('getOrderClassesLookup returns processHours', () => {
    it('should map processHours field', (done) => {
      const mockResponse = { data: [{ code: 'R', orderClassDesc: 'Routine', processHours: 24 }] };
      service.getOrderClassesLookup().subscribe(result => {
        expect(result[0].processHours).toBe(24);
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/order-classes'));
      req.flush(mockResponse);
    });

    it('should default processHours to null when missing', (done) => {
      const mockResponse = { data: [{ code: 'R', orderClassDesc: 'Routine' }] };
      service.getOrderClassesLookup().subscribe(result => {
        expect(result[0].processHours).toBeNull();
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/order-classes'));
      req.flush(mockResponse);
    });
  });

  // ---------------------------------------------------------------------------
  // getContracts returns substituteFlag
  // ---------------------------------------------------------------------------
  describe('getContracts returns substituteFlag', () => {
    it('should map substituteFlag field', (done) => {
      const mockResponse = { data: [{ contractId: 'C1', substituteFlag: 'Y' }] };
      service.getContracts('CUST1').subscribe(result => {
        expect(result[0].substituteFlag).toBe('Y');
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/contracts/CUST1'));
      req.flush(mockResponse);
    });

    it('should default substituteFlag to null when missing', (done) => {
      const mockResponse = { data: [{ contractId: 'C1' }] };
      service.getContracts('CUST1').subscribe(result => {
        expect(result[0].substituteFlag).toBeNull();
        done();
      });
      const req = httpMock.expectOne((r: any) => r.url.includes('/export-orders/lookups/contracts/CUST1'));
      req.flush(mockResponse);
    });
  });
});
