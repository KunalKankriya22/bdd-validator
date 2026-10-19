/**
 * Contact DTOs
 * Shared models for contact management across the application
 */

/**
 * Base Contact Model
 * Core contact information used across different contexts
 */
export interface ContactModel {
  /** Contact unique identifier */
  contactId?: string;

  /** Contact type code (from VALID_MASTER_CODES) */
  contactType: string;

  /** Contact type description */
  contactTypeDescription?: string;

  /** Salutation code (Mr., Mrs., Ms., Dr., etc.) */
  salutation?: string | null;

  /** Salutation description */
  salutationDescription?: string;

  /** First name */
  firstName?: string | null;

  /** Middle name */
  middleName?: string | null;

  /** Last name (Required) */
  lastName: string;

  /** Title/Position code */
  title?: string | null;

  /** Title description */
  titleDescription?: string;

  /** Effective date (ISO 8601 format) */
  effDate: string;

  /** Termination date (ISO 8601 format) */
  termDate?: string | null;

  /** Chapter ID */
  chapterId?: string;

  /** Program ID */
  programId?: string;

  /** Insert date */
  insertDate?: string;

  /** Insert user */
  insertUser?: string;

  /** Audit key for optimistic locking */
  auditKey?: number;
}

/**
 * Contact with Address Model
 * Extended contact model that includes associated address information
 */
export interface ContactWithAddressModel extends ContactModel {
  /** Associated address ID */
  addressId?: string;

  /** Address information */
  address?: ContactAddressModel;

  /** Contact notes */
  notes?: ContactNoteModel[];
}

/**
 * Contact Address Model
 * Address information associated with a contact
 * Supports both domestic and international addresses
 */
export interface ContactAddressModel {
  /** Address unique identifier */
  addressId?: string;

  /** Chapter ID */
  chapterId?: string;

  /** Domestic Address Fields */
  /** Address line 1 */
  address1?: string | null;

  /** Address line 2 */
  address2?: string | null;

  /** Address line 3 */
  address3?: string | null;

  /** Street name */
  streetName?: string | null;

  /** Suite/Apartment number */
  suiteApt?: string | null;

  /** ZIP code */
  zip?: string | null;

  /** USPS ID reference */
  uspsId?: number | null;

  /** City */
  city?: string | null;

  /** State */
  state?: string | null;

  /** Mapsco reference */
  mapsco?: string | null;

  /** Phone Numbers */
  /** Day phone area code */
  dAreaCode?: string | null;

  /** Day phone number */
  dPhoneNo?: string | null;

  /** Day phone extension */
  extension?: number | null;

  /** Day phone country code */
  dCountryCode?: string | null;

  /** Fax area code */
  fAreaCode?: string | null;

  /** Fax phone number */
  fPhoneNo?: string | null;

  /** Fax country code */
  fCountryCode?: string | null;

  /** Home phone area code */
  hAreaCode?: string | null;

  /** Home phone number */
  hPhoneNo?: string | null;

  /** Home phone country code */
  hCountryCode?: string | null;

  /** Mobile phone area code */
  mAreaCode?: string | null;

  /** Mobile phone number */
  mPhoneNo?: string | null;

  /** Pager number */
  pager?: string | null;

  /** Email address */
  email?: string | null;

  /** Web address/URL */
  webAddress?: string | null;

  /** International Address Fields */
  /** International address flag ('Y' or 'N') */
  intlAddrFlag?: string | null;

  /** International address line 1 (street name) */
  intlAddress1?: string | null;

  /** International address line 2 */
  intlAddress2?: string | null;

  /** International address line 3 */
  intlAddress3?: string | null;

  /** International address line 4 */
  intlAddress4?: string | null;

  /** Country name */
  countryName?: string | null;

  /** International postal code */
  intlPostalCode?: string | null;

  /** International home phone number */
  intlHomePhoneNo?: string | null;

  /** International work phone number */
  intlWorkPhoneNo?: string | null;

  /** International work phone extension */
  intlWorkPhoneExt?: string | null;

  /** International mobile phone number */
  intlMobilePhoneNo?: string | null;

  /** International fax number */
  intlFaxNo?: string | null;
}

/**
 * Contact Note Model
 * Notes associated with a contact
 */
export interface ContactNoteModel {
  /** Note unique identifier */
  noteId?: string;

  /** Associated contact ID */
  contactId?: string;

  /** Note text content */
  notes: string;

  /** Note text (alternative property name) */
  noteText?: string;

  /** Created by user */
  createdBy?: string;

  /** Created date (ISO 8601 format) */
  createdDate?: string;

  /** Version for optimistic locking */
  version?: string;

  /** Audit key */
  auditKey?: number;
}

/**
 * Create Contact Request DTO
 * Request payload for creating a new contact
 */
export interface CreateContactRequestDto {
  /** Entity ID (sponsor, customer, etc.) */
  entityId?: string;

  /** Contact type code (Required) */
  contactType: string;

  /** Last name (Required) */
  lastName: string;

  /** Effective date (Required, ISO 8601 format) */
  effDate: string;

  /** Chapter ID (Required) */
  chapterId: string;

  /** Salutation code */
  salutation?: string | null;

  /** First name */
  firstName?: string | null;

  /** Middle name */
  middleName?: string | null;

  /** Title code */
  title?: string | null;

  /** Termination date (ISO 8601 format) */
  termDate?: string | null;

  /** Associated address information */
  address?: ContactAddressModel;

  /** Contact notes */
  notes?: { noteText: string }[];
}

/**
 * Update Contact Request DTO
 * Request payload for updating an existing contact
 */
export interface UpdateContactRequestDto {
  /** Contact ID (Required) */
  contactId: string;

  /** Chapter ID */
  chapterId?: string;

  /** Contact type code */
  contactType?: string | null;

  /** Salutation code */
  salutation?: string | null;

  /** First name */
  firstName?: string | null;

  /** Middle name */
  middleName?: string | null;

  /** Last name */
  lastName?: string | null;

  /** Title code */
  title?: string | null;

  /** Effective date (ISO 8601 format) */
  effDate?: string;

  /** Termination date (ISO 8601 format) */
  termDate?: string | null;

  /** Address ID for updates */
  addressId?: string;

  /** Updated address information */
  address?: ContactAddressModel;

  /** Audit key for optimistic locking */
  auditKey?: number;
}

/**
 * Contact Search Parameters DTO
 * Query parameters for searching contacts
 */
export interface ContactSearchParamsDto {
  /** Chapter ID filter */
  chapterId?: string;

  /** Entity ID (sponsor, customer, etc.) */
  entityId?: string;

  /** Contact name search term */
  contactName?: string;

  /** Contact type filter */
  contactType?: string;

  /** Match type for name search (exact, starts, contains) */
  matchType?: string;

  /** Include terminated contacts */
  showTerminated?: boolean;

  /** General search keyword */
  searchKeyword?: string;

  /** Sort field and direction */
  sort?: string;

  /** Page number (for pagination) */
  page?: number;

  /** Page size (for pagination) */
  pageSize?: number;
}

/**
 * Contact Response DTO
 * Response wrapper for contact operations
 */
export interface ContactResponseDto<T = ContactModel> {
  /** Success flag */
  success?: boolean;

  /** Response message */
  message?: string;

  /** Error message */
  error?: string;

  /** Error code */
  errorCode?: string;

  /** HTTP status code */
  statusCode?: number;

  /** Single contact item */
  item?: T;

  /** List of contacts */
  data?: T[];

  /** Total record count (for pagination) */
  totalRecords?: number;

  /** Total count (alternative property) */
  total?: number;
}

/**
 * Contact Type Lookup DTO
 * Lookup data for contact types
 */
export interface ContactTypeLookupDto {
  /** Code type */
  codeType?: string;

  /** Contact type code */
  code: string;

  /** Contact type description */
  description: string;

  /** Active flag */
  active?: boolean;
}

/**
 * Salutation Lookup DTO
 * Lookup data for salutations
 */
export interface SalutationLookupDto {
  /** Code type */
  codeType?: string;

  /** Salutation code */
  code: string;

  /** Salutation description */
  description: string;

  /** Active flag */
  active?: boolean;
}

/**
 * Title Lookup DTO
 * Lookup data for titles/positions
 */
export interface TitleLookupDto {
  /** Code type */
  codeType?: string;

  /** Title code */
  code: string;

  /** Title description */
  description: string;

  /** Active flag */
  active?: boolean;
}

/**
 * Contact Name Lookup Item
 * Simplified contact name for autocomplete/lookups
 */
export interface ContactNameLookupDto {
  /** Contact ID */
  contactId?: string;

  /** First name */
  firstName?: string | null;

  /** Last name */
  lastName: string;

  /** Full name (computed) */
  fullName?: string;
}

/**
 * ZIP Code Lookup DTO
 * ZIP code lookup with city/state information
 */
export interface ZipCodeLookupDto {
  /** ZIP code */
  zip: string;

  /** City name */
  city: string;

  /** State code */
  state: string;

  /** USPS ID */
  uspsId: number;
}

/**
 * Delete Contact Request DTO
 * Request payload for deleting a contact
 */
export interface DeleteContactRequestDto {
  /** Contact ID to delete */
  contactId: string;

  /** Chapter ID */
  chapterId?: string;

  /** Audit key for optimistic locking */
  auditKey?: number;
}

/**
 * Terminate Contact Request DTO
 * Request payload for terminating a contact (soft delete)
 */
export interface TerminateContactRequestDto {
  /** Contact ID to terminate */
  contactId: string;

  /** Termination date (ISO 8601 format) */
  termDate: string;

  /** Chapter ID */
  chapterId?: string;

  /** Audit key for optimistic locking */
  auditKey?: number;
}
