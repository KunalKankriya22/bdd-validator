import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CustomerContactApiService } from './customer-contact-api.service';
import { ApiService } from '@shared/services/api.service';
import { LoggingService } from '@shared/services/logging.service';
import {
  CustomerContactDto,
  ContactTypeDto,
  CreateCustomerContactRequestDto,
  UpdateCustomerContactRequestDto,
  ReturnResult
} from '../models/customer-contact.model';

describe('CustomerContactApiService', () => {
  let service: CustomerContactApiService;
  let apiService: jasmine.SpyObj<ApiService>;
  let loggingService: jasmine.SpyObj<LoggingService>;

  const mockContact: CustomerContactDto = {
    customerId: 'CUST001',
    chapterId: 'TEST',
    instId: '0001',
    contactType: 'D',
    contactTypeDesc: 'Director',
    firstName: 'John',
    lastName: 'Smith',
    salutation: 'Mr.',
    title: 'Dr.',
    dayPhoneNo: '555-1234',
    nightPhoneNo: '555-5678',
    faxNo: '555-9999',
    effDate: '2024-01-01T00:00:00',
    termDate: null,
    lastModifiedDate: '2024-06-01T00:00:00'
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);
    const loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CustomerContactApiService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy }
      ]
    });

    service = TestBed.inject(CustomerContactApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    loggingService = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  describe('getCustomerContacts', () => {
    it('should retrieve contacts via GET', (done) => {
      const mockResponse: ReturnResult<CustomerContactDto> = { data: [mockContact], total: 1 };
      apiService.get.and.returnValue(of(mockResponse));

      service.getCustomerContacts('CUST001').subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0]).toEqual(mockContact);
        done();
      });
    });

    it('should pass includeTerminated=true when specified', (done) => {
      const mockResponse: ReturnResult<CustomerContactDto> = { data: [mockContact], total: 1 };
      apiService.get.and.returnValue(of(mockResponse));

      service.getCustomerContacts('CUST001', true).subscribe(() => {
        const url = apiService.get.calls.mostRecent().args[0];
        expect(url).toContain('includeTerminated=true');
        done();
      });
    });

    it('should default includeTerminated to false', (done) => {
      const mockResponse: ReturnResult<CustomerContactDto> = { data: [], total: 0 };
      apiService.get.and.returnValue(of(mockResponse));

      service.getCustomerContacts('CUST001').subscribe(() => {
        const url = apiService.get.calls.mostRecent().args[0];
        expect(url).toContain('includeTerminated=false');
        done();
      });
    });

    it('should handle empty data array in response', (done) => {
      apiService.get.and.returnValue(of({ data: undefined, total: undefined }));

      service.getCustomerContacts('CUST001').subscribe(result => {
        expect(result.data).toEqual([]);
        expect(result.total).toBe(0);
        done();
      });
    });

    it('should propagate errors and log them', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ error: 'Network error' })));

      service.getCustomerContacts('CUST001').subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.error).toBe('Network error');
          expect(loggingService.error).toHaveBeenCalledWith('Error loading customer contacts', jasmine.anything());
          done();
        }
      });
    });
  });

  describe('getContactTypes', () => {
    it('should retrieve contact types via GET', (done) => {
      const mockTypes: ContactTypeDto[] = [
        { code: 'D', description: 'Director' },
        { code: 'F', description: 'Financial' }
      ];
      apiService.get.and.returnValue(of({ data: mockTypes }));

      service.getContactTypes().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('D');
        expect(result[1].code).toBe('F');
        done();
      });
    });

    it('should propagate errors and log them', (done) => {
      apiService.get.and.returnValue(throwError(() => ({ error: 'Contact types error' })));

      service.getContactTypes().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.error).toBe('Contact types error');
          expect(loggingService.error).toHaveBeenCalledWith('Error loading contact types', jasmine.anything());
          done();
        }
      });
    });
  });

  describe('createCustomerContact', () => {
    const dto: CreateCustomerContactRequestDto = {
      customerId: 'CUST001',
      contactType: 'D',
      firstName: 'John',
      lastName: 'Smith',
      dayPhoneNo: '555-1234',
      effDate: '2026-06-08'
    };

    it('should POST to the create endpoint', (done) => {
      const mockResponse: ReturnResult<void> = { success: true, message: 'Created' };
      apiService.post.and.returnValue(of(mockResponse));

      service.createCustomerContact(dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiService.post).toHaveBeenCalled();
        done();
      });
    });

    it('should propagate create errors and log them', (done) => {
      apiService.post.and.returnValue(throwError(() => ({ error: 'Bad Request' })));

      service.createCustomerContact(dto).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.error).toBe('Bad Request');
          expect(loggingService.error).toHaveBeenCalledWith('Error creating customer contact', jasmine.anything());
          done();
        }
      });
    });
  });

  describe('updateCustomerContact', () => {
    const dto: UpdateCustomerContactRequestDto = {
      instId: '0001',
      newContactType: 'D',
      firstName: 'John',
      lastName: 'Smith',
      dayPhoneNo: '555-9999',
      effDate: '2026-06-08'
    };

    it('should PUT to the update endpoint', (done) => {
      const mockResponse: ReturnResult<void> = { success: true, message: 'Updated' };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateCustomerContact('CUST001', 'D', dto).subscribe(result => {
        expect(result.success).toBeTrue();
        expect(apiService.put).toHaveBeenCalled();
        done();
      });
    });

    it('should pass correct URL parameters', (done) => {
      apiService.put.and.returnValue(of({ success: true }));

      service.updateCustomerContact('CUST001', 'D', dto).subscribe(() => {
        const url = apiService.put.calls.mostRecent().args[0];
        expect(url).toContain('CUST001');
        expect(url).toContain('/D');
        done();
      });
    });

    it('should propagate update errors and log them', (done) => {
      apiService.put.and.returnValue(throwError(() => ({ error: 'Conflict' })));

      service.updateCustomerContact('CUST001', 'D', dto).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.error).toBe('Conflict');
          expect(loggingService.error).toHaveBeenCalledWith('Error updating customer contact', jasmine.anything());
          done();
        }
      });
    });
  });
});
