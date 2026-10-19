import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SpecialOrderApiService } from './special-order-api.service';
import { environment } from 'src/environments/environment';

describe('SpecialOrderApiService', () => {
  let service: SpecialOrderApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SpecialOrderApiService]
    });
    service = TestBed.inject(SpecialOrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── Customers ──

  describe('getCustomersLookup', () => {
    it('should map response.data to LookupItem[] with customerId/name fields', (done: DoneFn) => {
      const mockResponse = {
        data: [
          { customerId: 'CUST-001', name: 'Parkland Hospital' },
          { customerId: 'CUST-002', name: 'Baylor Medical' }
        ],
        success: true
      };

      service.getCustomersLookup().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ code: 'CUST-001', description: 'Parkland Hospital' });
        expect(result[1]).toEqual({ code: 'CUST-002', description: 'Baylor Medical' });
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/customers') && !r.url.includes('search='));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should append search param when provided', (done: DoneFn) => {
      const mockResponse = { data: [{ customerId: 'CUST-001', name: 'Parkland Hospital' }], success: true };

      service.getCustomersLookup('Park').subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('search=Park'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to code/description fields when customerId/name are absent', (done: DoneFn) => {
      const mockResponse = { data: [{ code: 'C1', description: 'Customer One' }] };

      service.getCustomersLookup().subscribe(result => {
        expect(result[0]).toEqual({ code: 'C1', description: 'Customer One' });
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/customers'));
      req.flush(mockResponse);
    });

    it('should return empty array when data is not an array', (done: DoneFn) => {
      service.getCustomersLookup().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/customers'));
      req.flush({ data: 'not-an-array' });
    });

    it('should return empty array when response is null', (done: DoneFn) => {
      service.getCustomersLookup().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/customers'));
      req.flush(null);
    });
  });

  // ── Customer by ID ──

  describe('getCustomerById', () => {
    it('should extract data[0] from response', (done: DoneFn) => {
      const customer = { customerId: 'CUST-001', name: 'Parkland Hospital' };
      const mockResponse = { data: [customer], success: true };

      service.getCustomerById('CUST-001').subscribe(result => {
        expect(result).toEqual(customer);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('customer-profile/CUST-001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to data when data[0] is undefined', (done: DoneFn) => {
      const mockResponse = { data: { customerId: 'CUST-001' } };

      service.getCustomerById('CUST-001').subscribe(result => {
        expect(result.customerId).toBe('CUST-001');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('customer-profile/CUST-001'));
      req.flush(mockResponse);
    });

    it('should fall back to raw response when data is null', (done: DoneFn) => {
      const mockResponse = { customerId: 'CUST-001' };

      service.getCustomerById('CUST-001').subscribe(result => {
        expect(result.customerId).toBe('CUST-001');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('customer-profile/CUST-001'));
      req.flush(mockResponse);
    });
  });

  // ── Consignees ──

  describe('getConsignees', () => {
    it('should map consignee fields correctly', (done: DoneFn) => {
      const mockResponse = {
        data: [{ consigneeId: 'CON-1', name: 'Main Office', address: '123 Main St' }],
        success: true
      };

      service.getConsignees('CUST-001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ consigneeId: 'CON-1', consigneeName: 'Main Office', address: '123 Main St' });
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/consignees/CUST-001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use fallback fields (code, consigneeName)', (done: DoneFn) => {
      const mockResponse = { data: [{ code: 'CON-2', consigneeName: 'Branch' }] };

      service.getConsignees('CUST-001').subscribe(result => {
        expect(result[0].consigneeId).toBe('CON-2');
        expect(result[0].consigneeName).toBe('Branch');
        expect(result[0].address).toBe('');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/consignees/CUST-001'));
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done: DoneFn) => {
      service.getConsignees('CUST-001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/consignees/CUST-001'));
      req.flush({ data: null });
    });
  });

  // ── Contacts ──

  describe('getContacts', () => {
    it('should map all contact fields including renamed ones', (done: DoneFn) => {
      const mockResponse = {
        data: [{
          contactType: 'PR',
          lastName: 'Smith',
          firstName: 'John',
          salutation: 'Mr.',
          title: 'Director',
          dayPhoneNo: '555-1234',
          faxNo: '555-5678',
          nightPhoneNo: '555-9012',
          telexNo: '555-3456',
          effDate: '2025-01-01',
          termDate: '2025-12-31'
        }],
        success: true
      };

      service.getContacts('CUST-001').subscribe(result => {
        expect(result.length).toBe(1);
        const contact = result[0];
        expect(contact.contactId).toBe('PR');
        expect(contact.lastName).toBe('Smith');
        expect(contact.firstName).toBe('John');
        expect(contact.salutation).toBe('Mr.');
        expect(contact.title).toBe('Director');
        expect(contact.contactType).toBe('PR');
        expect(contact.contactTypeCode).toBe('PR');
        expect(contact.dayPhone).toBe('555-1234');
        expect(contact.faxNumber).toBe('555-5678');
        expect(contact.nightPhone).toBe('555-9012');
        expect(contact.telexNumber).toBe('555-3456');
        expect(contact.effectiveDate).toBe('2025-01-01');
        expect(contact.terminationDate).toBe('2025-12-31');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('customer-profile/CUST-001/contacts'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use alternate field names when primary names are absent', (done: DoneFn) => {
      const mockResponse = {
        data: [{
          contactId: 'CT-1',
          lastName: 'Doe',
          firstName: 'Jane',
          dayPhone: '555-0000',
          faxNumber: '555-1111',
          nightPhone: '555-2222',
          telexNumber: '555-3333',
          effectiveDate: '2025-06-01',
          terminationDate: '2026-06-01'
        }]
      };

      service.getContacts('CUST-001').subscribe(result => {
        const contact = result[0];
        expect(contact.dayPhone).toBe('555-0000');
        expect(contact.faxNumber).toBe('555-1111');
        expect(contact.nightPhone).toBe('555-2222');
        expect(contact.telexNumber).toBe('555-3333');
        expect(contact.effectiveDate).toBe('2025-06-01');
        expect(contact.terminationDate).toBe('2026-06-01');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('contacts'));
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done: DoneFn) => {
      service.getContacts('CUST-001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('contacts'));
      req.flush({ data: 'invalid' });
    });
  });

  // ── Contracts ──

  describe('getContracts', () => {
    it('should map contract fields to LookupItem', (done: DoneFn) => {
      const mockResponse = { data: [{ contractId: 'CTR-001', description: 'Annual Contract' }] };

      service.getContracts('CUST-001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ code: 'CTR-001', description: 'Annual Contract' });
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/contracts/CUST-001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fall back to code field when contractId is absent', (done: DoneFn) => {
      const mockResponse = { data: [{ code: 'CTR-002' }] };

      service.getContracts('CUST-001').subscribe(result => {
        expect(result[0].code).toBe('CTR-002');
        expect(result[0].description).toBe('CTR-002');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/contracts/CUST-001'));
      req.flush(mockResponse);
    });
  });

  // ── Create Contact ──

  describe('createContact', () => {
    it('should POST contact and extract data[0]', (done: DoneFn) => {
      const contactPayload = { lastName: 'Smith', firstName: 'John', contactType: 'PR' };
      const mockResponse = { data: [{ contactId: 'CT-NEW', ...contactPayload }], success: true };

      service.createContact('CUST-001', contactPayload).subscribe(result => {
        expect(result.contactId).toBe('CT-NEW');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('customer-profile/CUST-001/contacts'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(contactPayload);
      req.flush(mockResponse);
    });

    it('should fall back to item when data[0] is undefined', (done: DoneFn) => {
      const mockResponse = { item: { contactId: 'CT-ITEM' } };

      service.createContact('CUST-001', {}).subscribe(result => {
        expect(result.contactId).toBe('CT-ITEM');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('contacts'));
      req.flush(mockResponse);
    });
  });

  // ── Simple Lookup Endpoints (code/description pattern) ──

  describe('simple lookup endpoints', () => {
    const simpleLookups: Array<{
      methodName: string;
      urlFragment: string;
      args: any[];
      sourceFields: { code: string; description: string };
    }> = [
      {
        methodName: 'getContactTypes',
        urlFragment: 'dropdowns/contact-types',
        args: [],
        sourceFields: { code: 'contactTypeCode', description: 'contactType' }
      },
      {
        methodName: 'getProductTypesLookup',
        urlFragment: 'lookups/product-types',
        args: [],
        sourceFields: { code: 'productType', description: 'productTypeDesc' }
      },
      {
        methodName: 'getBloodTypesLookup',
        urlFragment: 'lookups/blood-types/RBC',
        args: ['RBC'],
        sourceFields: { code: 'aboCode', description: 'aboDesc' }
      },
      {
        methodName: 'getOrderModesLookup',
        urlFragment: 'lookups/order-modes',
        args: [],
        sourceFields: { code: 'code', description: 'description' }
      },
      {
        methodName: 'getAttributeGroupsLookup',
        urlFragment: 'lookups/attribute-groups',
        args: [],
        sourceFields: { code: 'code', description: 'description' }
      },
      {
        methodName: 'getAttributeCodesLookup',
        urlFragment: 'lookups/attribute-codes/GRP1',
        args: ['GRP1'],
        sourceFields: { code: 'code', description: 'description' }
      },
      {
        methodName: 'getOrderClassesLookup',
        urlFragment: 'lookups/order-classes',
        args: [],
        sourceFields: { code: 'code', description: 'description' }
      },
      {
        methodName: 'getSalutationsLookup',
        urlFragment: 'lookups/salutations',
        args: [],
        sourceFields: { code: 'code', description: 'description' }
      },
      {
        methodName: 'getAntigenCodesLookup',
        urlFragment: 'lookups/antigens',
        args: [],
        sourceFields: { code: 'code', description: 'description' }
      },
      {
        methodName: 'getSourceProductsLookup',
        urlFragment: 'lookups/source-products/PLT',
        args: ['PLT'],
        sourceFields: { code: 'code', description: 'description' }
      }
    ];

    simpleLookups.forEach(({ methodName, urlFragment, args, sourceFields }) => {
      describe(methodName, () => {
        it('should GET and map to LookupItem[]', (done: DoneFn) => {
          const mockData = [
            { [sourceFields.code]: 'A', [sourceFields.description]: 'Alpha' },
            { [sourceFields.code]: 'B', [sourceFields.description]: 'Beta' }
          ];
          const mockResponse = { data: mockData, success: true };

          (service as any)[methodName](...args).subscribe((result: any[]) => {
            expect(result.length).toBe(2);
            expect(result[0].code).toBe('A');
            expect(result[0].description).toBe('Alpha');
            expect(result[1].code).toBe('B');
            expect(result[1].description).toBe('Beta');
            done();
          });

          const req = httpMock.expectOne(r => r.url.includes(urlFragment));
          expect(req.request.method).toBe('GET');
          req.flush(mockResponse);
        });

        it('should fall back to code for description when description is missing', (done: DoneFn) => {
          const mockResponse = { data: [{ code: 'X' }] };

          (service as any)[methodName](...args).subscribe((result: any[]) => {
            expect(result[0].code).toBe('X');
            expect(result[0].description).toBe('X');
            done();
          });

          const req = httpMock.expectOne(r => r.url.includes(urlFragment));
          req.flush(mockResponse);
        });

        it('should return empty array for non-array response', (done: DoneFn) => {
          (service as any)[methodName](...args).subscribe((result: any[]) => {
            expect(result).toEqual([]);
            done();
          });

          const req = httpMock.expectOne(r => r.url.includes(urlFragment));
          req.flush({ data: null });
        });
      });
    });
  });

  // ── Tiers Lookup (special mapping with template string) ──

  describe('getTiersLookup', () => {
    it('should map tier data with formatted description and unitPrice', (done: DoneFn) => {
      const mockResponse = {
        data: [{ tier: 1, dateRange: '01/01 - 03/31 ', unitPrice: 250.00 }],
        success: true
      };

      service.getTiersLookup('RBC').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('1');
        expect(result[0].description).toBe('Tier 1 - 01/01 - 03/31 ($250)');
        expect(result[0].unitPrice).toBe(250.00);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/tiers/RBC'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle missing dateRange gracefully', (done: DoneFn) => {
      const mockResponse = { data: [{ tier: 2, unitPrice: 100 }] };

      service.getTiersLookup('PLT').subscribe(result => {
        expect(result[0].code).toBe('2');
        expect(result[0].description).toBe('Tier 2 -  ($100)');
        expect(result[0].unitPrice).toBe(100);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/tiers/PLT'));
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done: DoneFn) => {
      service.getTiersLookup('RBC').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/tiers/RBC'));
      req.flush({ data: 'invalid' });
    });
  });

  // ── Charge Codes Lookup (extra fields) ──

  describe('getChargeCodesLookup', () => {
    it('should map charge code fields including unitAmount, crDbInd, percentDiscFlag', (done: DoneFn) => {
      const mockResponse = {
        data: [{ code: 'SHIP', description: 'Shipping', unitAmount: 25.50, crDbInd: 'D', percentDiscFlag: 'N' }],
        success: true
      };

      service.getChargeCodesLookup().subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0].code).toBe('SHIP');
        expect(result[0].description).toBe('Shipping');
        expect(result[0].unitAmount).toBe(25.50);
        expect(result[0].crDbInd).toBe('D');
        expect(result[0].percentDiscFlag).toBe('N');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/charge-codes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use default values when optional fields are missing', (done: DoneFn) => {
      const mockResponse = { data: [{ code: 'MISC' }] };

      service.getChargeCodesLookup().subscribe(result => {
        expect(result[0].unitAmount).toBe(0);
        expect(result[0].crDbInd).toBe('');
        expect(result[0].percentDiscFlag).toBe('');
        expect(result[0].description).toBe('MISC');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/charge-codes'));
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done: DoneFn) => {
      service.getChargeCodesLookup().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/charge-codes'));
      req.flush(null);
    });
  });

  // ── Open Orders, Inventory, Charges, Notes ──

  describe('getOpenOrderItems', () => {
    it('should return response.data', (done: DoneFn) => {
      const items = [{ orderNo: 'SO-001', itemNo: 1 }];
      const mockResponse = { data: items, success: true };

      service.getOpenOrderItems('CUST-001').subscribe(result => {
        expect(result).toEqual(items);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/open-orders/CUST-001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done: DoneFn) => {
      service.getOpenOrderItems('CUST-001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/open-orders/CUST-001'));
      req.flush({ data: null });
    });
  });

  describe('getInventorySummary', () => {
    it('should return data[0]', (done: DoneFn) => {
      const summary = { availableQty: 10, allocatedQty: 3 };
      const mockResponse = { data: [summary], success: true };

      service.getInventorySummary('RBC', 'A+').subscribe(result => {
        expect(result).toEqual(summary);
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('inventory-summary') &&
        r.url.includes('productType=RBC') &&
        r.url.includes('bloodType=A')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty or missing', (done: DoneFn) => {
      service.getInventorySummary('RBC', 'O+').subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('inventory-summary'));
      req.flush({ data: [] });
    });
  });

  describe('getInventoryTiers', () => {
    it('should return response.data', (done: DoneFn) => {
      const tiers = [{ tier: 1, qty: 5 }, { tier: 2, qty: 3 }];
      const mockResponse = { data: tiers, success: true };

      service.getInventoryTiers('RBC', 'A+').subscribe(result => {
        expect(result).toEqual(tiers);
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('inventory-tiers') &&
        r.url.includes('productType=RBC')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done: DoneFn) => {
      service.getInventoryTiers('RBC', 'O+').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('inventory-tiers'));
      req.flush({ data: null });
    });
  });

  describe('checkInventoryStock', () => {
    it('should return data[0] with stock check result', (done: DoneFn) => {
      const stockResult = { available: true, availableQty: 10, requiredQty: 5 };
      const mockResponse = { data: [stockResult], success: true };

      service.checkInventoryStock('RBC', 'A+', 5).subscribe(result => {
        expect(result).toEqual(stockResult);
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('inventory-stock-check') &&
        r.url.includes('requiredQty=5')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', (done: DoneFn) => {
      service.checkInventoryStock('RBC', 'O+', 100).subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('inventory-stock-check'));
      req.flush({ data: [] });
    });
  });

  // ── Order Charges ──

  describe('getOrderCharges', () => {
    it('should return response.data', (done: DoneFn) => {
      const charges = [{ chargeCode: 'SHIP', amount: 25 }];
      const mockResponse = { data: charges, success: true };

      service.getOrderCharges('SO-001').subscribe(result => {
        expect(result).toEqual(charges);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/charges'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done: DoneFn) => {
      service.getOrderCharges('SO-001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('SO-001/charges'));
      req.flush({ data: null });
    });
  });

  describe('addOrderCharge', () => {
    it('should POST charge dto', (done: DoneFn) => {
      const dto = { chargeCode: 'SHIP', amount: 25 };
      const mockResponse = { success: true };

      service.addOrderCharge('SO-001', dto).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/charges'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('deleteOrderCharge', () => {
    it('should DELETE and return true on success', (done: DoneFn) => {
      service.deleteOrderCharge('SO-001', 'SHIP').subscribe(result => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/charges/SHIP'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should return false when success is not present', (done: DoneFn) => {
      service.deleteOrderCharge('SO-001', 'SHIP').subscribe(result => {
        expect(result).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('charges/SHIP'));
      req.flush({});
    });
  });

  // ── Order Notes ──

  describe('getOrderNotes', () => {
    it('should return data[0]', (done: DoneFn) => {
      const note = { noteId: 1, note: 'Rush order' };
      const mockResponse = { data: [note], success: true };

      service.getOrderNotes('SO-001').subscribe(result => {
        expect(result).toEqual(note);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/notes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is empty', (done: DoneFn) => {
      service.getOrderNotes('SO-001').subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('SO-001/notes'));
      req.flush({ data: [] });
    });
  });

  describe('saveOrderNotes', () => {
    it('should PUT note payload', (done: DoneFn) => {
      const mockResponse = { success: true };

      service.saveOrderNotes('SO-001', 'Updated note text').subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/notes'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: 'Updated note text' });
      req.flush(mockResponse);
    });
  });

  // ── Special Order CRUD ──

  describe('createOrder', () => {
    it('should POST order dto and return data[0]', (done: DoneFn) => {
      const dto: any = {
        customerId: 'CUST-001', contractId: 'CTR-001', orderedBy: 'admin',
        orderClass: 'SP', orderMode: 'PH', orderType: 'SP',
        consigneeId: 'CON-1', patientName: 'John Doe'
      };
      const createdOrder = { orderNo: 'SO-NEW-001', ...dto, orderStatus: 'EN', insertDate: '2025-03-01', insertUserId: 'admin' };
      const mockResponse = { data: [createdOrder], success: true, message: 'Created', statusCode: 200, total: 1 };

      service.createOrder(dto).subscribe(result => {
        expect(result.orderNo).toBe('SO-NEW-001');
        expect(result.orderStatus).toBe('EN');
        done();
      });

      const req = httpMock.expectOne(r => r.url.endsWith('/special-orders'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('getOrder', () => {
    it('should GET order by orderNo and return data[0]', (done: DoneFn) => {
      const order = {
        orderNo: 'SO-001', chapterId: 'DAL', customerId: 'CUST-001',
        orderStatus: 'EN', insertDate: '2025-03-01', insertUserId: 'admin'
      };
      const mockResponse = { data: [order], success: true, statusCode: 200, total: 1 };

      service.getOrder('SO-001').subscribe(result => {
        expect(result.orderNo).toBe('SO-001');
        expect(result.customerId).toBe('CUST-001');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('updateOrder', () => {
    it('should PUT order dto and return data[0]', (done: DoneFn) => {
      const dto: any = { orderedBy: 'updatedUser', patientName: 'Jane Doe' };
      const updatedOrder = { orderNo: 'SO-001', orderedBy: 'updatedUser', patientName: 'Jane Doe' };
      const mockResponse = { data: [updatedOrder], success: true };

      service.updateOrder('SO-001', dto).subscribe(result => {
        expect(result.orderedBy).toBe('updatedUser');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });

    it('should fall back to raw response when data is null', (done: DoneFn) => {
      const mockResponse = { success: true, message: 'Updated' };

      service.updateOrder('SO-001', {} as any).subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001'));
      req.flush(mockResponse);
    });
  });

  describe('cancelOrder', () => {
    it('should DELETE and return true on success', (done: DoneFn) => {
      service.cancelOrder('SO-001').subscribe(result => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should return false when success is absent', (done: DoneFn) => {
      service.cancelOrder('SO-001').subscribe(result => {
        expect(result).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001'));
      req.flush({});
    });
  });

  // ── Order Items ──

  describe('getOrderItems', () => {
    it('should GET and return response.data', (done: DoneFn) => {
      const items = [
        { orderNo: 'SO-001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 2, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 },
        { orderNo: 'SO-001', itemNo: 2, productType: 'PLT', bloodType: 'O+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
      ];
      const mockResponse = { data: items, success: true, statusCode: 200, total: 2 };

      service.getOrderItems('SO-001').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].productType).toBe('RBC');
        expect(result[1].productType).toBe('PLT');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('addOrderItem', () => {
    it('should POST item dto and return all items', (done: DoneFn) => {
      const dto: any = { itemNo: 2, productType: 'FFP', bloodType: 'O+', tier: 1, requiredQty: 3 };
      const mockResponse = {
        data: [
          { orderNo: 'SO-001', itemNo: 1, productType: 'RBC', bloodType: 'A+', tier: 1, requiredQty: 1, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 },
          { orderNo: 'SO-001', itemNo: 2, productType: 'FFP', bloodType: 'O+', tier: 1, requiredQty: 3, itemStatus: 'EN', allocatedQty: 0, shippedQty: 0 }
        ],
        success: true, statusCode: 200, total: 2
      };

      service.addOrderItem('SO-001', dto).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[1].productType).toBe('FFP');
        expect(result[1].requiredQty).toBe(3);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush(mockResponse);
    });
  });

  describe('deleteOrderItem', () => {
    it('should DELETE item and return response.success', (done: DoneFn) => {
      const mockResponse = { data: [], success: true, statusCode: 200, total: 0 };

      service.deleteOrderItem('SO-001', 1).subscribe(result => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/1'));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should return false when success is false', (done: DoneFn) => {
      service.deleteOrderItem('SO-001', 99).subscribe(result => {
        expect(result).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('items/99'));
      req.flush({ success: false });
    });
  });

  // ── Item Antigens ──

  describe('getItemAntigens', () => {
    it('should GET antigens and return response.data', (done: DoneFn) => {
      const antigens = [{ antigenId: 'Fya', description: 'Duffy a' }];
      const mockResponse = { data: antigens, success: true };

      service.getItemAntigens('SO-001', 1).subscribe(result => {
        expect(result).toEqual(antigens);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/1/antigens'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done: DoneFn) => {
      service.getItemAntigens('SO-001', 1).subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('items/1/antigens'));
      req.flush({ data: null });
    });
  });

  describe('addItemAntigen', () => {
    it('should POST antigenId and return response.data', (done: DoneFn) => {
      const antigens = [{ antigenId: 'Fya' }, { antigenId: 'K' }];
      const mockResponse = { data: antigens, success: true };

      service.addItemAntigen('SO-001', 1, 'K').subscribe(result => {
        expect(result.length).toBe(2);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/1/antigens'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ antigenId: 'K' });
      req.flush(mockResponse);
    });

    it('should return empty array when data is null', (done: DoneFn) => {
      service.addItemAntigen('SO-001', 1, 'X').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('items/1/antigens'));
      req.flush({ data: null });
    });
  });

  describe('deleteItemAntigen', () => {
    it('should DELETE antigen and return true on success', (done: DoneFn) => {
      service.deleteItemAntigen('SO-001', 1, 'K').subscribe(result => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/1/antigens/K'));
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    it('should return false when success is absent', (done: DoneFn) => {
      service.deleteItemAntigen('SO-001', 1, 'K').subscribe(result => {
        expect(result).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('antigens/K'));
      req.flush({});
    });
  });

  // ── Gap #2: getProductTypesLookup with params ──

  describe('getProductTypesLookup (with params)', () => {
    it('should append customerId param when provided', (done: DoneFn) => {
      const mockResponse = { data: [{ productType: 'RBC', productTypeDesc: 'Red Blood Cells' }] };

      service.getProductTypesLookup('CUST-001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ code: 'RBC', description: 'Red Blood Cells' });
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('lookups/product-types') &&
        r.url.includes('customerId=CUST-001') &&
        !r.url.includes('consigneeId')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should append consigneeId param when provided', (done: DoneFn) => {
      const mockResponse = { data: [{ productType: 'PLT', productTypeDesc: 'Platelets' }] };

      service.getProductTypesLookup(undefined, 'CON-001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ code: 'PLT', description: 'Platelets' });
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('lookups/product-types') &&
        r.url.includes('consigneeId=CON-001') &&
        !r.url.includes('customerId')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should append both params when both provided', (done: DoneFn) => {
      const mockResponse = { data: [{ productType: 'FFP', productTypeDesc: 'Fresh Frozen Plasma' }] };

      service.getProductTypesLookup('CUST-001', 'CON-001').subscribe(result => {
        expect(result.length).toBe(1);
        expect(result[0]).toEqual({ code: 'FFP', description: 'Fresh Frozen Plasma' });
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('lookups/product-types') &&
        r.url.includes('customerId=CUST-001') &&
        r.url.includes('consigneeId=CON-001')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should not append params when neither provided', (done: DoneFn) => {
      const mockResponse = { data: [{ productType: 'RBC', productTypeDesc: 'Red Blood Cells' }] };

      service.getProductTypesLookup().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(r =>
        r.url.includes('lookups/product-types') &&
        !r.url.includes('?')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  // ── Gap #5: getPayeesLookup ──

  describe('getPayeesLookup', () => {
    it('should GET payees and map to LookupItem[]', (done: DoneFn) => {
      const mockResponse = {
        data: [
          { customerId: 'PAY-001', name: 'Payee One' },
          { customerId: 'PAY-002', name: 'Payee Two' }
        ],
        success: true
      };

      service.getPayeesLookup('CUST-001').subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0]).toEqual({ code: 'PAY-001', description: 'Payee One' });
        expect(result[1]).toEqual({ code: 'PAY-002', description: 'Payee Two' });
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/payees/CUST-001'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should use customerId/name fields for mapping', (done: DoneFn) => {
      const mockResponse = { data: [{ customerId: 'PAY-100', name: 'Main Payee' }] };

      service.getPayeesLookup('CUST-001').subscribe(result => {
        expect(result[0].code).toBe('PAY-100');
        expect(result[0].description).toBe('Main Payee');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/payees/CUST-001'));
      req.flush(mockResponse);
    });

    it('should fall back to code/description fields', (done: DoneFn) => {
      const mockResponse = { data: [{ code: 'PAY-FB', description: 'Fallback Payee' }] };

      service.getPayeesLookup('CUST-001').subscribe(result => {
        expect(result[0].code).toBe('PAY-FB');
        expect(result[0].description).toBe('Fallback Payee');
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/payees/CUST-001'));
      req.flush(mockResponse);
    });

    it('should return empty array for non-array data', (done: DoneFn) => {
      service.getPayeesLookup('CUST-001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/payees/CUST-001'));
      req.flush({ data: 'not-an-array' });
    });

    it('should return empty array when response is null', (done: DoneFn) => {
      service.getPayeesLookup('CUST-001').subscribe(result => {
        expect(result).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('lookups/payees/CUST-001'));
      req.flush(null);
    });
  });

  // ── Gap #13: Item Notes (edge cases) ──

  describe('getItemNotes', () => {
    it('should return data[0] from response', (done: DoneFn) => {
      const note = { noteId: 1, note: 'Item note text' };
      const mockResponse = { data: [note], success: true };

      service.getItemNotes('SO-001', 1).subscribe(result => {
        expect(result).toEqual(note);
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/1/notes'));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return null when data is null', (done: DoneFn) => {
      service.getItemNotes('SO-001', 1).subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/1/notes'));
      req.flush({ data: null });
    });

    it('should return null when data is empty array', (done: DoneFn) => {
      service.getItemNotes('SO-001', 1).subscribe(result => {
        expect(result).toBeNull();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('items/1/notes'));
      req.flush({ data: [] });
    });
  });

  describe('saveItemNotes', () => {
    it('should PUT note payload with correct body', (done: DoneFn) => {
      const mockResponse = { success: true };

      service.saveItemNotes('SO-001', 1, 'Updated item note').subscribe(result => {
        expect(result.success).toBeTrue();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/1/notes'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: 'Updated item note' });
      req.flush(mockResponse);
    });

    it('should send correct body with note field', (done: DoneFn) => {
      const mockResponse = { success: true, data: [{ noteId: 1 }] };

      service.saveItemNotes('SO-001', 2, 'Special handling required').subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(r => r.url.includes('special-orders/SO-001/items/2/notes'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: 'Special handling required' });
      req.flush(mockResponse);
    });
  });
});
