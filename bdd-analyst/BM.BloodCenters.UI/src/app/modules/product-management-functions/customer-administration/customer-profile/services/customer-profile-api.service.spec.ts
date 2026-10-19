import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CustomerProfileApiService } from './customer-profile-api.service';
import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import {
  CustomerProfileDto,
  CreateCustomerProfileRequestDto,
  UpdateCustomerProfileRequestDto,
  CustomerProfileQueryDto
} from '../models/customer-profile.model';

describe('CustomerProfileApiService', () => {
  let service: CustomerProfileApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  const mockCustomerProfile: CustomerProfileDto = {
    customerId: 'TEST001',
    chapterId: '0001',
    name: 'Test Hospital',
    customerType: 'HO',
    customerTypeDesc: 'Hospital',
    shortName: 'TEST HOSP',
    alphaKey: 'TESTHOSP',
    intFlag: 'N',
    address1: '123 Main St',
    address2: null,
    address3: null,
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    country: 'USA',
    phoneNo: '214-555-0100',
    phoneExt: '1234',
    faxNo: '214-555-0101',
    intPhone: null,
    telexNo: null,
    codFlag: 'N',
    returnAcceptedFlag: 'Y',
    arAccount: 'AR-TEST001',
    fiPriceSchNo: '01',
    priceChangeFlag: null,
    ednGenFlag: null,
    plasmaFileType: null,
    phApprFlag: null,
    insApprFlag: null,
    effDate: '2024-06-01T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2024-06-02T10:00:00Z',
    payeeId: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CustomerProfileApiService]
    });

    service = TestBed.inject(CustomerProfileApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getCustomerProfiles', () => {
    it('should retrieve customer profiles with query parameters', () => {
      const query: CustomerProfileQueryDto = {
        customerType: 'HO'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockCustomerProfile],
        totalCount: 1
      };

      service.getCustomerProfiles(10, 0, query).subscribe((response) => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].customerId).toBe('TEST001');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.LIST(10, 0)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(query);
      req.flush(mockResponse);
    });

    it('should retrieve customer profiles without query parameters', () => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [mockCustomerProfile]
      };

      service.getCustomerProfiles(10, 0).subscribe((response) => {
        expect(response.data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.LIST(10, 0)}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('getCustomerProfileById', () => {
    it('should retrieve a single customer profile', () => {
      const customerId = 'TEST001';
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockCustomerProfile
      };

      service.getCustomerProfileById(customerId).subscribe((profile) => {
        expect(profile.customerId).toBe(customerId);
        expect(profile.name).toBe('Test Hospital');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.GET_BY_ID(customerId)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createCustomerProfile', () => {
    it('should create a new customer profile', () => {
      const createDto: CreateCustomerProfileRequestDto = {
        customerId: 'TEST002',
        name: 'New Hospital',
        customerType: 'HO',
        shortName: 'NEW HOSP',
        intFlag: 'N',
        address1: '456 Oak Ave',
        city: 'Houston',
        state: 'TX',
        zip: '77001',
        country: 'USA',
        codFlag: 'N',
        returnAcceptedFlag: 'Y',
        arAccount: 'AR-TEST002',
        effDate: '2024-06-01'
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        message: 'Created',
        data: { ...mockCustomerProfile, ...createDto }
      };

      service.createCustomerProfile(createDto).subscribe((profile) => {
        expect(profile.customerId).toBe('TEST002');
        expect(profile.name).toBe('New Hospital');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.CREATE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });
  });

  describe('updateCustomerProfile', () => {
    it('should update an existing customer profile', () => {
      const customerId = 'TEST001';
      const updateDto: UpdateCustomerProfileRequestDto = {
        name: 'Updated Hospital',
        customerType: 'HO',
        shortName: 'UPD HOSP',
        intFlag: 'N',
        address1: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        country: 'USA',
        codFlag: 'Y',
        returnAcceptedFlag: 'Y',
        arAccount: 'AR-TEST001',
        effDate: '2024-06-01'
      };

      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Updated',
        data: { ...mockCustomerProfile, name: 'Updated Hospital' }
      };

      service.updateCustomerProfile(customerId, updateDto).subscribe((profile) => {
        expect(profile.name).toBe('Updated Hospital');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.UPDATE(customerId)}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });
  });

  describe('getCustomerTypes', () => {
    it('should retrieve customer types', () => {
      const mockTypes = [
        { code: 'HO', description: 'Hospital', source: 'CUSTOMER_TYPE' },
        { code: 'MG', description: 'Manufacturing', source: 'CUSTOMER_TYPE' }
      ];

      service.getCustomerTypes().subscribe((types) => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('HO');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.CUSTOMER_TYPES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTypes);
    });
  });

  describe('getStateCodes', () => {
    it('should retrieve state codes', () => {
      const mockStates = [
        { code: 'TX', description: 'Texas' },
        { code: 'CA', description: 'California' }
      ];

      service.getStateCodes().subscribe((states) => {
        expect(states.length).toBe(2);
        expect(states[0].code).toBe('TX');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.STATES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStates);
    });
  });

  describe('getPayees', () => {
    it('should retrieve payees', () => {
      const mockPayees = [
        { customerId: 'PAY001', name: 'Payee 1' },
        { customerId: 'PAY002', name: 'Payee 2' }
      ];

      service.getPayees().subscribe((payees) => {
        expect(payees.length).toBe(2);
        expect(payees[0].customerId).toBe('PAY001');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.PAYEES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPayees);
    });
  });

  describe('getPlasmaFileTypes', () => {
    it('should retrieve plasma file types', () => {
      const mockTypes = [
        { code: 'TYPE1', description: 'Plasma Type 1' },
        { code: 'TYPE2', description: 'Plasma Type 2' }
      ];

      service.getPlasmaFileTypes().subscribe((types) => {
        expect(types.length).toBe(2);
        expect(types[0].code).toBe('TYPE1');
      });

      const req = httpMock.expectOne(`${baseUrl}${API.CUSTOMER_PROFILE.PLASMA_TYPES}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTypes);
    });
  });
});
