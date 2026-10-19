import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CustomerPayeeApiService } from './customer-payee-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  PayeeCustomerDto,
  CreatePayeeCustomerRequestDto,
  UpdatePayeeCustomerRequestDto,
  ReturnResult
} from '../models/customer-payee.model';

describe('CustomerPayeeApiService', () => {
  let service: CustomerPayeeApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockPayee: PayeeCustomerDto = {
    customerId: 'DAL-PA0004',
    chapterId: 'DAL',
    customerType: 'PA',
    name: 'Okinawa Japan Hospital',
    shortName: 'Okinawa',
    alphaKey: 'OKINAWA JA',
    address1: '876 Heartbeat Lane, Suite 1000',
    address2: null,
    address3: null,
    city: 'Tokyo',
    state: null,
    zip: '27709',
    country: 'Japan',
    phoneNo: '987-654-3219',
    phoneExt: null,
    faxNo: null,
    telexNo: '2345234',
    intPhone: '8976543219',
    intFlag: 'Y',
    codFlag: 'N',
    effDate: '30-Jan-2025',
    termDate: null,
    lastModifiedDate: '11-Jan-2025'
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CustomerPayeeApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(CustomerPayeeApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getPayeeCustomers', () => {
    it('should retrieve payee customers', (done) => {
      const mockResponse: ReturnResult<PayeeCustomerDto> = {
        data: [mockPayee],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getPayeeCustomers(100, 0).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0]).toEqual(mockPayee);
        done();
      });
    });

    it('should pass query parameters', (done) => {
      const mockResponse: ReturnResult<PayeeCustomerDto> = {
        data: [mockPayee],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      const query = { includeTerminated: true, sortColumn: 'customerId', sortOrder: 'ASC' };
      service.getPayeeCustomers(100, 0, query).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          jasmine.stringContaining('/payee-customer/100/0'),
          query
        );
        done();
      });
    });


  });

  describe('getPayeeById', () => {
    it('should retrieve a specific payee', (done) => {
      const mockResponse: ReturnResult<PayeeCustomerDto> = {
        item: mockPayee
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getPayeeById('DAL-PA0004').subscribe(result => {
        expect(result).toEqual(mockPayee);
        done();
      });
    });


  });

  describe('createPayee', () => {
    it('should create a new payee', (done) => {
      const createDto: CreatePayeeCustomerRequestDto = {
        name: 'Test Hospital',
        shortName: 'Test',
        alphaKey: 'TEST HOSP',
        address1: '123 Main St',
        city: 'Dallas',
        state: 'TX',
        zip: '75201',
        country: 'USA',
        intFlag: 'N',
        effDate: '2026-06-08'
      };

      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Payee customer created successfully',
        item: { customerId: 'DAL-PA0005' }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.createPayee(createDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.item.customerId).toBe('DAL-PA0005');
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should handle create errors', (done) => {
      const createDto: CreatePayeeCustomerRequestDto = {
        name: '',
        shortName: '',
        alphaKey: '',
        address1: '',
        city: '',
        zip: '',
        intFlag: 'N',
        effDate: ''
      };

      apiService.post.and.returnValue(throwError(() => ({
        error: { errorCode: '0201', message: 'Name is required' }
      })));

      service.createPayee(createDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.errorCode).toBe('0201');
          done();
        }
      });
    });
  });

  describe('getPayeeCustomers error', () => {
    it('should propagate errors from getPayeeCustomers', (done) => {
      apiService.post.and.returnValue(throwError(() => ({ status: 500, error: 'Server Error' })));
      service.getPayeeCustomers(100, 0).subscribe({
        next: () => fail('should have failed'),
        error: (err) => { expect(err.status).toBe(500); done(); }
      });
    });

    it('should default data to empty array and total to 0 when response fields are absent', (done) => {
      apiService.post.and.returnValue(of({}));
      service.getPayeeCustomers(100, 0).subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });
  });

  describe('getPayeeById additional', () => {
    it('should retrieve payee from data array when data[0] present', (done) => {
      const mockResponse: ReturnResult<PayeeCustomerDto> = { data: [mockPayee] };
      apiService.get.and.returnValue(of(mockResponse));
      service.getPayeeById('DAL-PA0004').subscribe(result => {
        expect(result).toEqual(mockPayee);
        done();
      });
    });

    it('should return null when neither data nor item is present', (done) => {
      apiService.get.and.returnValue(of({}));
      service.getPayeeById('DAL-PA0004').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate errors from getPayeeById', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 404 })));
      service.getPayeeById('NOTEXIST').subscribe({
        next: () => fail('should have failed'),
        error: (err) => { expect(err.status).toBe(404); done(); }
      });
    });
  });

  describe('getStateCodes', () => {
    it('should retrieve state codes successfully', (done) => {
      const mockStates = [{ code: 'CO', description: 'Colorado' }, { code: 'TX', description: 'Texas' }];
      apiService.get.and.returnValue(of(mockStates));
      service.getStateCodes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('CO');
        done();
      });
    });

    it('should propagate errors from getStateCodes', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getStateCodes().subscribe({
        next: () => fail('should have failed'),
        error: (err) => { expect(err.status).toBe(500); done(); }
      });
    });
  });

  describe('getZones', () => {
    it('should retrieve zones successfully', (done) => {
      const mockZones = [{ code: 'Z1', description: 'Zone 1' }, { code: 'Z2', description: 'Zone 2' }];
      apiService.get.and.returnValue(of(mockZones));
      service.getZones().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('Z1');
        done();
      });
    });

    it('should propagate errors from getZones', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getZones().subscribe({
        next: () => fail('should have failed'),
        error: (err) => { expect(err.status).toBe(500); done(); }
      });
    });
  });

  describe('updatePayee', () => {
    it('should update an existing payee', (done) => {
      const updateDto: UpdatePayeeCustomerRequestDto = {
        name: 'Updated Hospital',
        shortName: 'Updated',
        alphaKey: 'UPDATED HO',
        address1: '456 Oak Ave',
        city: 'Dallas',
        state: 'TX',
        zip: '75202',
        country: 'USA',
        intFlag: 'N',
        effDate: '2026-01-30'
      };

      const mockResponse: ReturnResult<any> = {
        success: true,
        message: 'Payee customer updated successfully'
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updatePayee('DAL-PA0004', updateDto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should handle update errors', (done) => {
      const updateDto: UpdatePayeeCustomerRequestDto = {
        name: 'Test',
        shortName: 'T',
        alphaKey: 'TEST',
        address1: '123 Main',
        city: 'Dallas',
        zip: '75201',
        intFlag: 'N',
        effDate: '2020-01-01'
      };

      apiService.put.and.returnValue(throwError(() => ({
        error: { errorCode: '5015', message: 'Effective date cannot be in past' }
      })));

      service.updatePayee('DAL-PA0004', updateDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.errorCode).toBe('5015');
          done();
        }
      });
    });
  });
});
