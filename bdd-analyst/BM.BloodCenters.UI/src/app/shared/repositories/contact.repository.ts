import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { LoggingService } from '../services/logging.service';
import { IContactRepository } from './contact-repository.interface';
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

/**
 * Contact Repository Implementation
 * Concrete implementation of IContactRepository for managing contact data
 * Follows the repository pattern to abstract data access logic
 */
@Injectable({
  providedIn: 'root'
})
export class ContactRepository implements IContactRepository {
  private readonly apiService = inject(ApiService);
  private readonly loggingService = inject(LoggingService);

  /**
   * Get contact by ID
   * GET /api/v1/contacts/{contactId}
   */
  getContactById(
    contactId: string,
    includeAddress: boolean = true,
    includeNotes: boolean = true
  ): Observable<ContactWithAddressModel | null> {
    const endpoint = `/api/v1/contacts/${encodeURIComponent(contactId)}`;
    const params: any = {};

    if (includeAddress) {
      params.includeAddress = 'true';
    }
    if (includeNotes) {
      params.includeNotes = 'true';
    }

    this.loggingService.log(`Fetching contact: ${contactId}`, {
      includeAddress,
      includeNotes
    });

    return this.apiService.get<ContactWithAddressModel>(endpoint, { params }).pipe(
      map(response => {
        this.loggingService.log(`Successfully fetched contact: ${contactId}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching contact: ${contactId}`, error);
        return of(null);
      })
    );
  }

  /**
   * Search contacts
   * GET /api/v1/contacts/search
   */
  searchContacts(searchParams: ContactSearchParamsDto): Observable<ContactResponseDto<ContactModel>> {
    const endpoint = '/api/v1/contacts/search';
    const params = this.buildSearchParams(searchParams);

    this.loggingService.log('Searching contacts', searchParams);

    return this.apiService.get<ContactResponseDto<ContactModel>>(endpoint, { params }).pipe(
      map(response => {
        this.loggingService.log('Successfully searched contacts', {
          count: response.data?.length || 0,
          total: response.totalRecords || response.total || 0
        });
        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error searching contacts', error);
        return of({
          success: false,
          data: [],
          totalRecords: 0,
          error: error.message || 'Failed to search contacts'
        });
      })
    );
  }

  /**
   * Get contacts by entity ID
   * GET /api/v1/contacts/entity/{entityId}
   */
  getContactsByEntityId(
    entityId: string,
    chapterId?: string,
    includeTerminated: boolean = false
  ): Observable<ContactModel[]> {
    const endpoint = `/api/v1/contacts/entity/${encodeURIComponent(entityId)}`;
    const params: any = {};

    if (chapterId) {
      params.chapterId = chapterId;
    }
    if (includeTerminated) {
      params.includeTerminated = 'true';
    }

    this.loggingService.log(`Fetching contacts for entity: ${entityId}`, {
      chapterId,
      includeTerminated
    });

    return this.apiService.get<ContactModel[]>(endpoint, { params }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from contacts API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log(`Successfully fetched contacts for entity: ${entityId}`, {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching contacts for entity: ${entityId}`, error);
        return of([]);
      })
    );
  }

  /**
   * Get contacts by chapter
   * GET /api/v1/contacts/chapter/{chapterId}
   */
  getContactsByChapter(
    chapterId: string,
    activeOnly: boolean = true
  ): Observable<ContactModel[]> {
    const endpoint = `/api/v1/contacts/chapter/${encodeURIComponent(chapterId)}`;
    const params = activeOnly ? { activeOnly: 'true' } : undefined;

    this.loggingService.log(`Fetching contacts for chapter: ${chapterId}`, {
      activeOnly
    });

    return this.apiService.get<ContactModel[]>(endpoint, { params: params as any }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from contacts API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log(`Successfully fetched contacts for chapter: ${chapterId}`, {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error fetching contacts for chapter: ${chapterId}`, error);
        return of([]);
      })
    );
  }

  /**
   * Create new contact
   * POST /api/v1/contacts
   */
  createContact(contactData: CreateContactRequestDto): Observable<ContactResponseDto<ContactModel>> {
    const endpoint = '/api/v1/contacts';

    this.loggingService.log('Creating contact', {
      lastName: contactData.lastName,
      contactType: contactData.contactType
    });

    return this.apiService.post<ContactResponseDto<ContactModel>>(endpoint, contactData).pipe(
      map(response => {
        this.loggingService.log('Successfully created contact', {
          contactId: response.item?.contactId
        });
        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error creating contact', error);
        return of({
          success: false,
          error: error.message || 'Failed to create contact',
          statusCode: error.status || 500
        });
      })
    );
  }

  /**
   * Update existing contact
   * PUT /api/v1/contacts/{contactId}
   */
  updateContact(contactData: UpdateContactRequestDto): Observable<ContactResponseDto<ContactModel>> {
    const endpoint = `/api/v1/contacts/${encodeURIComponent(contactData.contactId)}`;

    this.loggingService.log(`Updating contact: ${contactData.contactId}`);

    return this.apiService.put<ContactResponseDto<ContactModel>>(endpoint, contactData).pipe(
      map(response => {
        this.loggingService.log(`Successfully updated contact: ${contactData.contactId}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error updating contact: ${contactData.contactId}`, error);
        return of({
          success: false,
          error: error.message || 'Failed to update contact',
          statusCode: error.status || 500
        });
      })
    );
  }

  /**
   * Delete contact
   * DELETE /api/v1/contacts/{contactId}
   */
  deleteContact(
    contactId: string,
    chapterId?: string,
    auditKey?: number
  ): Observable<ContactResponseDto> {
    const endpoint = `/api/v1/contacts/${encodeURIComponent(contactId)}`;
    const params: any = {};

    if (chapterId) {
      params.chapterId = chapterId;
    }
    if (auditKey !== undefined) {
      params.auditKey = auditKey.toString();
    }

    this.loggingService.log(`Deleting contact: ${contactId}`, {
      chapterId,
      auditKey
    });

    return this.apiService.delete<ContactResponseDto>(endpoint, { params }).pipe(
      map(response => {
        this.loggingService.log(`Successfully deleted contact: ${contactId}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error deleting contact: ${contactId}`, error);
        return of({
          success: false,
          error: error.message || 'Failed to delete contact',
          statusCode: error.status || 500
        });
      })
    );
  }

  /**
   * Terminate contact
   * PATCH /api/v1/contacts/{contactId}/terminate
   */
  terminateContact(
    contactId: string,
    termDate: string,
    chapterId?: string,
    auditKey?: number
  ): Observable<ContactResponseDto> {
    const endpoint = `/api/v1/contacts/${encodeURIComponent(contactId)}/terminate`;
    const body: any = { termDate };

    if (chapterId) {
      body.chapterId = chapterId;
    }
    if (auditKey !== undefined) {
      body.auditKey = auditKey;
    }

    this.loggingService.log(`Terminating contact: ${contactId}`, {
      termDate,
      chapterId
    });

    return this.apiService.patch<ContactResponseDto>(endpoint, body).pipe(
      map(response => {
        this.loggingService.log(`Successfully terminated contact: ${contactId}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error terminating contact: ${contactId}`, error);
        return of({
          success: false,
          error: error.message || 'Failed to terminate contact',
          statusCode: error.status || 500
        });
      })
    );
  }

  /**
   * Search contact names
   * GET /api/v1/contacts/names/search
   */
  searchContactNames(
    searchTerm: string,
    entityId?: string,
    chapterId?: string,
    activeOnly: boolean = true
  ): Observable<ContactNameLookupDto[]> {
    const endpoint = '/api/v1/contacts/names/search';
    const params: any = { q: searchTerm };

    if (entityId) {
      params.entityId = entityId;
    }
    if (chapterId) {
      params.chapterId = chapterId;
    }
    if (activeOnly) {
      params.activeOnly = 'true';
    }

    this.loggingService.log('Searching contact names', {
      searchTerm,
      entityId,
      chapterId,
      activeOnly
    });

    return this.apiService.get<ContactNameLookupDto[]>(endpoint, { params }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from contact names search API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully searched contact names', {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error searching contact names', error);
        return of([]);
      })
    );
  }

  /**
   * Lookup ZIP code
   * GET /api/v1/lookup/zip-codes/{zipCode}
   */
  lookupZipCode(zipCode: string): Observable<ZipCodeLookupDto | null> {
    const endpoint = `/api/v1/lookup/zip-codes/${encodeURIComponent(zipCode)}`;

    this.loggingService.log(`Looking up ZIP code: ${zipCode}`);

    return this.apiService.get<ZipCodeLookupDto>(endpoint).pipe(
      map(response => {
        this.loggingService.log(`Successfully looked up ZIP code: ${zipCode}`);
        return response;
      }),
      catchError(error => {
        this.loggingService.error(`Error looking up ZIP code: ${zipCode}`, error);
        return of(null);
      })
    );
  }

  /**
   * Validate contact
   * POST /api/v1/contacts/validate
   */
  validateContact(contactData: Partial<ContactModel>): Observable<ContactResponseDto> {
    const endpoint = '/api/v1/contacts/validate';

    this.loggingService.log('Validating contact data');

    return this.apiService.post<ContactResponseDto>(endpoint, contactData).pipe(
      map(response => {
        this.loggingService.log('Successfully validated contact data');
        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error validating contact data', error);
        return of({
          success: false,
          error: error.message || 'Failed to validate contact',
          statusCode: error.status || 500
        });
      })
    );
  }

  /**
   * Check for duplicate contacts
   * GET /api/v1/contacts/check-duplicates
   */
  checkDuplicateContacts(
    firstName: string | null,
    lastName: string,
    entityId?: string
  ): Observable<ContactModel[]> {
    const endpoint = '/api/v1/contacts/check-duplicates';
    const params: any = { lastName };

    if (firstName) {
      params.firstName = firstName;
    }
    if (entityId) {
      params.entityId = entityId;
    }

    this.loggingService.log('Checking for duplicate contacts', {
      firstName,
      lastName,
      entityId
    });

    return this.apiService.get<ContactModel[]>(endpoint, { params }).pipe(
      map(response => {
        if (!Array.isArray(response)) {
          this.loggingService.error('Invalid response format from duplicate check API', response);
          throw new Error('Invalid response format');
        }

        this.loggingService.log('Successfully checked for duplicate contacts', {
          count: response.length
        });

        return response;
      }),
      catchError(error => {
        this.loggingService.error('Error checking for duplicate contacts', error);
        return of([]);
      })
    );
  }

  /**
   * Build search parameters object from ContactSearchParamsDto
   * Helper method to convert search params to API query parameters
   */
  private buildSearchParams(searchParams: ContactSearchParamsDto): any {
    const params: any = {};

    if (searchParams.chapterId) {
      params.chapterId = searchParams.chapterId;
    }
    if (searchParams.entityId) {
      params.entityId = searchParams.entityId;
    }
    if (searchParams.contactName) {
      params.contactName = searchParams.contactName;
    }
    if (searchParams.contactType) {
      params.contactType = searchParams.contactType;
    }
    if (searchParams.matchType) {
      params.matchType = searchParams.matchType;
    }
    if (searchParams.showTerminated !== undefined) {
      params.showTerminated = searchParams.showTerminated.toString();
    }
    if (searchParams.searchKeyword) {
      params.searchKeyword = searchParams.searchKeyword;
    }
    if (searchParams.sort) {
      params.sort = searchParams.sort;
    }
    if (searchParams.page !== undefined) {
      params.page = searchParams.page.toString();
    }
    if (searchParams.pageSize !== undefined) {
      params.pageSize = searchParams.pageSize.toString();
    }

    return params;
  }
}
