import { Observable } from 'rxjs';
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
 * Contact Repository Interface
 * Defines the contract for contact data access operations
 * Used for managing contact records throughout the application
 */
export interface IContactRepository {
  /**
   * Get contact by ID
   * Retrieves a single contact with optional address and notes
   *
   * @param contactId - Unique contact identifier
   * @param includeAddress - If true, include associated address data
   * @param includeNotes - If true, include associated notes
   * @returns Observable of contact model or null if not found
   */
  getContactById(
    contactId: string,
    includeAddress?: boolean,
    includeNotes?: boolean
  ): Observable<ContactWithAddressModel | null>;

  /**
   * Search contacts
   * Returns contacts matching the search criteria with pagination support
   *
   * @param searchParams - Search parameters and filters
   * @returns Observable of contact response with data array and total count
   */
  searchContacts(searchParams: ContactSearchParamsDto): Observable<ContactResponseDto<ContactModel>>;

  /**
   * Get contacts by entity ID
   * Returns all contacts associated with a specific entity (sponsor, customer, etc.)
   *
   * @param entityId - Entity identifier (sponsor ID, customer ID, etc.)
   * @param chapterId - Optional chapter ID filter
   * @param includeTerminated - If true, include terminated contacts
   * @returns Observable array of contact models
   */
  getContactsByEntityId(
    entityId: string,
    chapterId?: string,
    includeTerminated?: boolean
  ): Observable<ContactModel[]>;

  /**
   * Get contacts by chapter
   * Returns all contacts for a specific chapter
   *
   * @param chapterId - Chapter identifier
   * @param activeOnly - If true, only return active (non-terminated) contacts
   * @returns Observable array of contact models
   */
  getContactsByChapter(
    chapterId: string,
    activeOnly?: boolean
  ): Observable<ContactModel[]>;

  /**
   * Create new contact
   * Creates a contact with optional address and notes
   *
   * @param contactData - Contact creation request data
   * @returns Observable of created contact response
   */
  createContact(contactData: CreateContactRequestDto): Observable<ContactResponseDto<ContactModel>>;

  /**
   * Update existing contact
   * Updates contact information, address, or notes
   *
   * @param contactData - Contact update request data
   * @returns Observable of updated contact response
   */
  updateContact(contactData: UpdateContactRequestDto): Observable<ContactResponseDto<ContactModel>>;

  /**
   * Delete contact
   * Permanently removes a contact from the system
   *
   * @param contactId - Contact ID to delete
   * @param chapterId - Chapter ID for validation
   * @param auditKey - Audit key for optimistic locking
   * @returns Observable of deletion response
   */
  deleteContact(
    contactId: string,
    chapterId?: string,
    auditKey?: number
  ): Observable<ContactResponseDto>;

  /**
   * Terminate contact
   * Soft-deletes a contact by setting the termination date
   *
   * @param contactId - Contact ID to terminate
   * @param termDate - Termination date (ISO 8601 format)
   * @param chapterId - Chapter ID for validation
   * @param auditKey - Audit key for optimistic locking
   * @returns Observable of termination response
   */
  terminateContact(
    contactId: string,
    termDate: string,
    chapterId?: string,
    auditKey?: number
  ): Observable<ContactResponseDto>;

  /**
   * Search contact names
   * Returns simplified contact name data for autocomplete/lookup scenarios
   *
   * @param searchTerm - Search string to match against contact names
   * @param entityId - Optional entity ID filter
   * @param chapterId - Optional chapter ID filter
   * @param activeOnly - If true, only return active contacts
   * @returns Observable array of contact name lookup DTOs
   */
  searchContactNames(
    searchTerm: string,
    entityId?: string,
    chapterId?: string,
    activeOnly?: boolean
  ): Observable<ContactNameLookupDto[]>;

  /**
   * Lookup ZIP code
   * Returns city and state information for a given ZIP code
   *
   * @param zipCode - ZIP code to lookup
   * @returns Observable of ZIP code lookup DTO or null if not found
   */
  lookupZipCode(zipCode: string): Observable<ZipCodeLookupDto | null>;

  /**
   * Validate contact
   * Validates contact data before creation or update
   *
   * @param contactData - Contact data to validate
   * @returns Observable of validation response
   */
  validateContact(contactData: Partial<ContactModel>): Observable<ContactResponseDto>;

  /**
   * Check for duplicate contacts
   * Searches for existing contacts with similar names
   *
   * @param firstName - First name
   * @param lastName - Last name
   * @param entityId - Optional entity ID to check within
   * @returns Observable array of potential duplicate contacts
   */
  checkDuplicateContacts(
    firstName: string | null,
    lastName: string,
    entityId?: string
  ): Observable<ContactModel[]>;
}
