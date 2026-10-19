import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ContactRepository } from './contact.repository';
import { ApiService } from '../services/api.service';
import { LoggingService } from '../services/logging.service';
import {
  ContactModel,
  ContactWithAddressModel,
  CreateContactRequestDto,
  UpdateContactRequestDto,
  ContactSearchParamsDto,
  ContactResponseDto,
  ContactNameLookupDto,
  ZipCodeLookupDto
} from '../models/contact.model';

describe('ContactRepository', () => {
  let repository: ContactRepository;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete', 'patch']);
    const loggingSpy = jasmine.createSpyObj('LoggingService', ['log', 'error']);

    TestBed.configureTestingModule({
      providers: [
        ContactRepository,
        { provide: ApiService, useValue: apiSpy },
        { provide: LoggingService, useValue: loggingSpy }
      ]
    });

    repository = TestBed.inject(ContactRepository);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
  });

  describe('getContactById', () => {
    it('should fetch contact by ID with address and notes', (done) => {
      const mockContact: ContactWithAddressModel = {
        contactId: 'C001',
        contactType: 'PRIMARY',
        lastName: 'Smith',
        firstName: 'John',
        effDate: '2024-01-01T00:00:00Z',
        chapterId: 'CH001'
      };

      apiServiceSpy.get.and.returnValue(of(mockContact));

      repository.getContactById('C001').subscribe(contact => {
        expect(contact).toEqual(mockContact);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/contacts/C001',
          jasmine.objectContaining({ params: jasmine.objectContaining({ includeAddress: 'true', includeNotes: 'true' }) })
        );
        expect(loggingServiceSpy.log).toHaveBeenCalled();
        done();
      });
    });

    it('should return null on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API Error')));

      repository.getContactById('C001').subscribe(contact => {
        expect(contact).toBeNull();
        expect(loggingServiceSpy.error).toHaveBeenCalled();
        done();
      });
    });

    it('should handle optional parameters', (done) => {
      apiServiceSpy.get.and.returnValue(of({} as ContactWithAddressModel));

      repository.getContactById('C001', false, false).subscribe(() => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/contacts/C001',
          { params: {} }
        );
        done();
      });
    });
  });

  describe('searchContacts', () => {
    it('should search contacts with parameters', (done) => {
      const searchParams: ContactSearchParamsDto = {
        chapterId: 'CH001',
        contactName: 'Smith',
        activeOnly: true,
        page: 1,
        pageSize: 10
      };

      const mockResponse: ContactResponseDto<ContactModel> = {
        success: true,
        data: [
          {
            contactId: 'C001',
            contactType: 'PRIMARY',
            lastName: 'Smith',
            effDate: '2024-01-01T00:00:00Z',
            chapterId: 'CH001'
          }
        ],
        totalRecords: 1
      };

      apiServiceSpy.get.and.returnValue(of(mockResponse));

      repository.searchContacts(searchParams).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.length).toBe(1);
        expect(loggingServiceSpy.log).toHaveBeenCalled();
        done();
      });
    });

    it('should return empty result on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API Error')));

      repository.searchContacts({}).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.data).toEqual([]);
        expect(loggingServiceSpy.error).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getContactsByEntityId', () => {
    it('should fetch contacts by entity ID', (done) => {
      const mockContacts: ContactModel[] = [
        {
          contactId: 'C001',
          contactType: 'PRIMARY',
          lastName: 'Smith',
          effDate: '2024-01-01T00:00:00Z',
          chapterId: 'CH001'
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockContacts));

      repository.getContactsByEntityId('E001', 'CH001').subscribe(contacts => {
        expect(contacts).toEqual(mockContacts);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/contacts/entity/E001',
          jasmine.objectContaining({ params: jasmine.objectContaining({ chapterId: 'CH001' }) })
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API Error')));

      repository.getContactsByEntityId('E001').subscribe(contacts => {
        expect(contacts).toEqual([]);
        expect(loggingServiceSpy.error).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('getContactsByChapter', () => {
    it('should fetch contacts by chapter', (done) => {
      const mockContacts: ContactModel[] = [
        {
          contactId: 'C001',
          contactType: 'PRIMARY',
          lastName: 'Smith',
          effDate: '2024-01-01T00:00:00Z',
          chapterId: 'CH001'
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockContacts));

      repository.getContactsByChapter('CH001').subscribe(contacts => {
        expect(contacts).toEqual(mockContacts);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/contacts/chapter/CH001',
          { params: { activeOnly: 'true' } as any }
        );
        done();
      });
    });
  });

  describe('createContact', () => {
    it('should create a new contact', (done) => {
      const createRequest: CreateContactRequestDto = {
        lastName: 'Smith',
        firstName: 'John',
        contactType: 'PRIMARY',
        effDate: '2024-01-01T00:00:00Z',
        chapterId: 'CH001'
      };

      const mockResponse: ContactResponseDto<ContactModel> = {
        success: true,
        item: {
          contactId: 'C001',
          ...createRequest
        }
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      repository.createContact(createRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/contacts',
          createRequest
        );
        done();
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ message: 'Create failed', status: 400 })));

      repository.createContact({} as CreateContactRequestDto).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('Create failed');
        expect(loggingServiceSpy.error).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('updateContact', () => {
    it('should update an existing contact', (done) => {
      const updateRequest: UpdateContactRequestDto = {
        contactId: 'C001',
        lastName: 'Smith',
        firstName: 'Jane',
        auditKey: 1
      };

      const mockResponse: ContactResponseDto<ContactModel> = {
        success: true,
        item: {
          contactId: 'C001',
          contactType: 'PRIMARY',
          lastName: 'Smith',
          firstName: 'Jane',
          effDate: '2024-01-01T00:00:00Z',
          chapterId: 'CH001'
        }
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      repository.updateContact(updateRequest).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
        expect(apiServiceSpy.put).toHaveBeenCalledWith(
          '/api/v1/contacts/C001',
          updateRequest
        );
        done();
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.put.and.returnValue(throwError(() => ({ message: 'Update failed', status: 400 })));

      repository.updateContact({ contactId: 'C001' } as UpdateContactRequestDto).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('Update failed');
        done();
      });
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact', (done) => {
      const mockResponse: ContactResponseDto = {
        success: true,
        message: 'Contact deleted successfully'
      };

      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      repository.deleteContact('C001', 'CH001', 1).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(apiServiceSpy.delete).toHaveBeenCalledWith(
          '/api/v1/contacts/C001',
          jasmine.objectContaining({ params: jasmine.objectContaining({ chapterId: 'CH001', auditKey: '1' }) })
        );
        done();
      });
    });

    it('should return error response on failure', (done) => {
      apiServiceSpy.delete.and.returnValue(throwError(() => ({ message: 'Delete failed', status: 400 })));

      repository.deleteContact('C001').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.error).toBe('Delete failed');
        done();
      });
    });
  });

  describe('terminateContact', () => {
    it('should terminate a contact', (done) => {
      const mockResponse: ContactResponseDto = {
        success: true,
        message: 'Contact terminated successfully'
      };

      apiServiceSpy.patch.and.returnValue(of(mockResponse));

      repository.terminateContact('C001', '2024-12-31T00:00:00Z', 'CH001', 1).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(apiServiceSpy.patch).toHaveBeenCalledWith(
          '/api/v1/contacts/C001/terminate',
          { termDate: '2024-12-31T00:00:00Z', chapterId: 'CH001', auditKey: 1 }
        );
        done();
      });
    });
  });

  describe('searchContactNames', () => {
    it('should search contact names', (done) => {
      const mockNames: ContactNameLookupDto[] = [
        {
          contactId: 'C001',
          firstName: 'John',
          lastName: 'Smith',
          fullName: 'John Smith'
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockNames));

      repository.searchContactNames('Smith', 'E001', 'CH001').subscribe(names => {
        expect(names).toEqual(mockNames);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/contacts/names/search',
          jasmine.objectContaining({
            params: jasmine.objectContaining({
              q: 'Smith',
              entityId: 'E001',
              chapterId: 'CH001',
              activeOnly: 'true'
            })
          })
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API Error')));

      repository.searchContactNames('Smith').subscribe(names => {
        expect(names).toEqual([]);
        done();
      });
    });
  });

  describe('lookupZipCode', () => {
    it('should lookup ZIP code', (done) => {
      const mockZip: ZipCodeLookupDto = {
        zip: '10001',
        city: 'New York',
        state: 'NY',
        uspsId: 12345
      };

      apiServiceSpy.get.and.returnValue(of(mockZip));

      repository.lookupZipCode('10001').subscribe(zip => {
        expect(zip).toEqual(mockZip);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/lookup/zip-codes/10001'
        );
        done();
      });
    });

    it('should return null on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API Error')));

      repository.lookupZipCode('99999').subscribe(zip => {
        expect(zip).toBeNull();
        done();
      });
    });
  });

  describe('validateContact', () => {
    it('should validate contact data', (done) => {
      const mockResponse: ContactResponseDto = {
        success: true,
        message: 'Contact is valid'
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      repository.validateContact({ lastName: 'Smith' }).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          '/api/v1/contacts/validate',
          { lastName: 'Smith' }
        );
        done();
      });
    });
  });

  describe('checkDuplicateContacts', () => {
    it('should check for duplicate contacts', (done) => {
      const mockContacts: ContactModel[] = [
        {
          contactId: 'C001',
          contactType: 'PRIMARY',
          lastName: 'Smith',
          firstName: 'John',
          effDate: '2024-01-01T00:00:00Z',
          chapterId: 'CH001'
        }
      ];

      apiServiceSpy.get.and.returnValue(of(mockContacts));

      repository.checkDuplicateContacts('John', 'Smith', 'E001').subscribe(contacts => {
        expect(contacts).toEqual(mockContacts);
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          '/api/v1/contacts/check-duplicates',
          jasmine.objectContaining({ params: jasmine.objectContaining({ lastName: 'Smith', firstName: 'John', entityId: 'E001' }) })
        );
        done();
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('API Error')));

      repository.checkDuplicateContacts(null, 'Smith').subscribe(contacts => {
        expect(contacts).toEqual([]);
        done();
      });
    });
  });
});
