/**
 * Service History Query Models and Interfaces
 * Based on Oracle Forms EQQSRVCE (eqqsrvce_fmb.xml)
 */

/**
 * Service History Data Model
 * Represents a single service event for equipment
 * Maps to DISPLAY_DATA block in Oracle Forms and backend ServiceHistoryDto
 */
export interface ServiceHistoryModel {
  /** Internal event reference ID (required for detail navigation) */
  eventReference: string;

  /** Equipment type code (e.g., CENT = Centrifuge) */
  equipType?: string | null;

  /** Equipment ID */
  equipId?: string | null;

  /** Equipment reference number (system-generated) */
  equipReference?: string | null;

  /** Equipment status code (e.g., IN, OUT) */
  equipStatus?: string | null;

  /** Service type code */
  serviceCode?: string | null;

  /** Service reason/type description (16 chars truncated - for grid) */
  serviceDescription?: string | null;

  /** Service reason/type description (full text - for details) */
  serviceDescriptionFull?: string | null;

  /** Service start date and time */
  serviceStart?: Date | string | null;

  /** Service end date and time (optional) */
  serviceEnd?: Date | string | null;

  /** Downtime flag (Y/N) */
  downtimeFlag?: string | null;

  /** Scheduled event flag (Y/N) */
  scheduledEvent?: string | null;

  /** QC reference number */
  qcReference?: string | null;

  /** Downtime type code */
  downtimeCode?: string | null;

  /** Downtime type description */
  downtimeDescription?: string | null;

  /** Downtime start date and time */
  downtimeStart?: Date | string | null;

  /** Downtime end date and time */
  downtimeEnd?: Date | string | null;

  /** Service person who performed the service */
  servicePerson?: string | null;

  /** External service company if applicable */
  serviceCompany?: string | null;
}

/**
 * Service History Filter Values
 * User-selected filter criteria
 */
export interface ServiceHistoryFilterValue {
  /** Equipment type code */
  equipmentType?: string | null;

  /** Equipment type description (for display) */
  equipmentTypeDescription?: string | null;

  /** Equipment ID */
  equipmentId?: string | null;

  /** Equipment reference number */
  equipmentReference?: string | null;

  /** Service start date (from) */
  startDate?: Date | null;

  /** Service end date (to) */
  endDate?: Date | null;
}

/**
 * API Request Parameters
 * Parameters sent to the backend API
 * Maps to ServiceHistoryQueryRequestDto
 */
export interface ServiceHistoryParamsDto {
  /** Equipment type filter */
  equipmentType?: string | null;

  /** Equipment ID filter */
  equipmentId?: string | null;

  /** Equipment reference filter */
  equipmentReference?: string | null;

  /** Start date filter (DateTime) */
  startDate?: string | null;

  /** End date filter (DateTime) */
  endDate?: string | null;

  /** Sort column */
  sortColumn?: string | null;

  /** Sort direction (A = ascending, D = descending) */
  sortDirection?: 'A' | 'D' | null;
}

/**
 * API Response Structure
 * Response from the backend service
 */
export interface ServiceHistoryResponse {
  /** Success flag */
  success?: boolean;

  /** Response message */
  message?: string;

  /** Status code */
  statusCode?: number;

  /** Array of service history records */
  data?: ServiceHistoryModel[];

  /** Total number of records (for pagination) */
  total?: number;

  /** Error details (if any) */
  errors?: any;
}

/**
 * Equipment Type Lookup Item
 * For equipment type dropdown/LOV
 * Maps to ServiceHistoryEquipmentTypeLookupDto
 */
export interface EquipmentTypeLookup {
  /** Equipment type code */
  equipType?: string | null;

  /** Equipment type description */
  equipTypeDescription?: string | null;
}

/**
 * Equipment ID Lookup Item
 * For equipment ID dropdown/LOV
 * Maps to ServiceHistoryEquipmentIdLookupDto
 */
export interface EquipmentIdLookup {
  /** Equipment ID */
  equipId?: string | null;

  /** Equipment reference */
  equipReference?: string | null;

  /** Service dates info */
  serviceDates?: string | null;
}

/**
 * Equipment Reference Lookup Item
 * For equipment reference dropdown/LOV
 * Maps to ServiceHistoryEquipmentReferenceLookupDto
 */
export interface EquipmentReferenceLookup {
  /** Equipment reference number */
  equipReference?: string | null;

  /** Service dates info */
  serviceDates?: string | null;
}

/**
 * Service Event Details
 * Detailed information shown in view-details dialog
 */
export interface ServiceEventDetails {
  /** Equipment information */
  equipmentType: string;
  equipmentTypeDescription?: string;
  equipmentId: string;
  equipmentRefNo: string;

  /** Event information */
  eventId: string;
  scheduledEvent: string; // Y or N
  qcRefNo?: string | null;

  /** Downtime information */
  downtimeType?: string | null;
  downtimeTypeDescription?: string | null;
  downtimeStartTime?: Date | string | null;
  downtimeEndTime?: Date | string | null;

  /** Service information */
  serviceType?: string | null;
  serviceTypeDescription?: string | null;
  servicePerson?: string | null;
  serviceCompany?: string | null;
  serviceStartTime?: Date | string | null;
  serviceEndTime?: Date | string | null;
}
