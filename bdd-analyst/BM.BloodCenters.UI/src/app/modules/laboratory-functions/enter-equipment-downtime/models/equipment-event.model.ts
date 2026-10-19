/**
 * Equipment Event Models
 * Defines TypeScript interfaces for Equipment Downtime and Service tracking
 * Based on API Documentation: MLT-12631
 */

/**
 * Equipment Event DTO - Response from API
 * Represents a complete equipment downtime or service event record
 */
export interface EquipmentEventDto {
  /** Unique event identifier (auto-generated) */
  eventReference: string;

  /** Equipment reference number */
  equipReference: string;

  /** Scheduled downtime flag: Y = Scheduled, N = Unscheduled */
  downtimeFlag?: string | null;

  /** Downtime reason code (max 5 chars) */
  downtimeCode?: string | null;

  /** Downtime description (from lookup table) */
  downtimeDescription?: string | null;

  /** Downtime start date/time (ISO 8601 format) */
  downtimeStart?: string | null;

  /** Downtime end date/time (ISO 8601 format) */
  downtimeEnd?: string | null;

  /** Service type code (max 5 chars) */
  serviceCode?: string | null;

  /** Service description (from lookup table) */
  serviceDescription?: string | null;

  /** Person who performed service (max 63 chars) */
  servicePerson?: string | null;

  /** Service company name (max 63 chars) */
  serviceCompany?: string | null;

  /** Service start date/time (ISO 8601 format) */
  serviceStart?: string | null;

  /** Service end date/time (ISO 8601 format) */
  serviceEnd?: string | null;

  /** Record creation timestamp */
  insertDate: string;

  /** User who created the record */
  insertUser: string;
}

/**
 * Create Equipment Event Request DTO
 * Used when creating a new equipment event
 */
export interface CreateEquipmentEventRequestDto {
  /** Equipment reference number (required, max 9 chars) */
  equipReference: string;

  /** Scheduled downtime flag: Y or N */
  downtimeFlag?: string | null;

  /** Downtime reason code (max 5 chars) */
  downtimeCode?: string | null;

  /** Downtime start date/time */
  downtimeStart?: string | null;

  /** Downtime end date/time */
  downtimeEnd?: string | null;

  /** Service type code (max 5 chars) */
  serviceCode?: string | null;

  /** Person who performed service (max 63 chars) */
  servicePerson?: string | null;

  /** Service company name (max 63 chars) */
  serviceCompany?: string | null;

  /** Service start date/time */
  serviceStart?: string | null;

  /** Service end date/time */
  serviceEnd?: string | null;
}

/**
 * Update Equipment Event Request DTO
 * Used when updating an existing equipment event
 * Same as Create DTO but without equipReference (it's in the URL path)
 */
export interface UpdateEquipmentEventRequestDto {
  /** Scheduled downtime flag: Y or N */
  downtimeFlag?: string | null;

  /** Downtime reason code (max 5 chars) */
  downtimeCode?: string | null;

  /** Downtime start date/time */
  downtimeStart?: string | null;

  /** Downtime end date/time */
  downtimeEnd?: string | null;

  /** Service type code (max 5 chars) */
  serviceCode?: string | null;

  /** Person who performed service (max 63 chars) */
  servicePerson?: string | null;

  /** Service company name (max 63 chars) */
  serviceCompany?: string | null;

  /** Service start date/time */
  serviceStart?: string | null;

  /** Service end date/time */
  serviceEnd?: string | null;
}

/**
 * Equipment Event Query DTO
 * Used for searching and filtering equipment events
 */
export interface EquipmentEventQueryDto {
  /** Filter by equipment reference */
  equipReference?: string | null;

  /** Filter by downtime code */
  downtimeCode?: string | null;

  /** Filter by service code */
  serviceCode?: string | null;

  /** Filter events from this date */
  fromDate?: string | null;

  /** Filter events to this date */
  toDate?: string | null;

  /** Search in person/company names */
  searchKeyword?: string | null;

  /** Column to sort by */
  sortColumn?: string | null;

  /** Sort order: ASC or DESC */
  sortOrder?: string | null;
}

/**
 * Lookup Item - For dropdown options
 * Used for Equipment Types, Downtime Codes, Service Codes, etc.
 */
export interface LookupItem {
  /** Code value */
  code: string;

  /** Display description */
  description: string;
}

/**
 * Equipment Item - For equipment selection
 */
export interface EquipmentItem {
  /** Equipment Type Code */
  equipmentType: string;

  /** Equipment Type Description */
  typeDescription: string;

  /** Equipment ID */
  equipmentId: string;

  /** Equipment Reference Number */
  equipReference: string;
}

/**
 * Form Value interface for component form
 */
export interface EquipmentEventFormValue {
  equipmentType: string | null;
  equipmentId: string | null;
  equipReference: string | null;
  scheduled: string | null;
  downtimeType: string | null;
  downtimeStart: string | null;
  downtimeEnd: string | null;
  serviceType: string | null;
  servicePerson: string | null;
  serviceCompany: string | null;
  serviceStart: string | null;
  serviceEnd: string | null;
}

/**
 * Create Equipment Event Response
 */
export interface CreateEquipmentEventResponse {
  eventReference: string;
}
