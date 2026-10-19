/**
 * Downtime History Query Models and Interfaces
 * Based on Oracle Forms EQQMAINT (eqqmaint_fmb.xml)
 */

/**
 * Downtime History Data Model
 * Represents a single downtime event for equipment
 * Maps to DISPLAY_DATA block in Oracle Forms and backend DowntimeHistoryDto
 */
export interface DowntimeHistoryModel {
  /** Internal event reference ID (required for detail navigation) */
  eventReference: string;

  /** Equipment type code (e.g., CENT = Centrifuge) */
  equipType?: string | null;

  /** Equipment ID */
  equipId?: string | null;

  /** Equipment reference number (system-generated) */
  equipReference?: string | null;

  /** Equipment status code (e.g., NEW, IN, OUT) */
  equipStatus?: string | null;

  /** Downtime reason code */
  downtimeCode?: string | null;

  /** Downtime reason description (truncated for grid display) */
  downtimeDescription?: string | null;

  /** Downtime start date and time */
  downtimeStart?: Date | string | null;

  /** Downtime end date and time (optional) */
  downtimeEnd?: Date | string | null;

  /** Scheduled downtime flag (Y/N) */
  downtimeFlag?: string | null;

  /** Service type code (if service performed during downtime) */
  serviceType?: string | null;

  /** Service type description */
  serviceTypeDescription?: string | null;

  /** Service person who performed the service */
  servicePerson?: string | null;

  /** External service company if applicable */
  serviceCompany?: string | null;

  /** Service start date and time */
  serviceStart?: Date | string | null;

  /** Service end date and time */
  serviceEnd?: Date | string | null;

  /** Scheduled event flag (Y/N) */
  scheduledEvent?: string | null;

  /** QC reference number */
  qcReference?: string | null;
}

/**
 * Downtime History Filter Values
 * User-selected filter criteria
 */
export interface DowntimeHistoryFilterValue {
  /** Equipment type code */
  equipmentType?: string | null;

  /** Equipment type description (for display) */
  equipmentTypeDescription?: string | null;

  /** Equipment ID */
  equipmentId?: string | null;

  /** Equipment reference number */
  equipmentReference?: string | null;

  /** Downtime start date (from) */
  startDate?: Date | null;

  /** Downtime end date (to) */
  endDate?: Date | null;
}

/**
 * API Request Parameters
 * Parameters sent to the backend API
 * Maps to DowntimeHistoryQueryRequestDto
 */
export interface DowntimeHistoryParamsDto {
  /** Equipment type filter */
  equipmentType?: string | null;

  /** Equipment ID filter */
  equipmentId?: string | null;

  /** Equipment reference filter */
  equipmentReference?: string | null;

  /** Start date filter (DateTime) - GMT */
  startDate?: string | null;

  /** End date filter (DateTime) - GMT */
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
export interface DowntimeHistoryResponse {
  /** Success flag */
  success?: boolean;

  /** Response message */
  message?: string;

  /** Status code */
  statusCode?: number;

  /** Array of downtime history records */
  data?: DowntimeHistoryModel[];

  /** Total number of records (for pagination) */
  total?: number;

  /** Error details (if any) */
  errors?: any;
}

/**
 * Equipment Type Lookup Item
 * For equipment type dropdown/LOV
 * Maps to DowntimeHistoryEquipmentTypeLookupDto
 */
export interface EquipmentTypeLookup {
  /** Equipment type code (e.g., "CENT") - sent to API for filtering */
  code: string;

  /** Equipment type description (formatted for dropdown: "CENT - Centrifuge Maintenance") */
  description: string;
}

/**
 * Equipment ID Lookup Item
 * For equipment ID dropdown/LOV
 * Maps to DowntimeHistoryEquipmentIdLookupDto
 */
export interface EquipmentIdLookup {
  /** Equipment ID */
  code?: string | null;

  /** Equipment ID description/display value */
  description?: string | null;
}

/**
 * Equipment Reference Lookup Item
 * For equipment reference dropdown/LOV
 * Maps to DowntimeHistoryEquipmentReferenceLookupDto
 */
export interface EquipmentReferenceLookup {
  /** Equipment reference code */
  code?: string | null;

  /** Equipment reference description/display value */
  description?: string | null;
}

/**
 * Downtime Event Details
 * Detailed information shown in view-details dialog
 */
export interface DowntimeEventDetails {
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
  downtimeType: string;
  downtimeTypeDescription: string;
  startTime: Date | string;
  endTime?: Date | string | null;

  /** Service information (if performed during downtime) */
  serviceType?: string | null;
  serviceTypeDescription?: string | null;
  servicePerson?: string | null;
  serviceCompany?: string | null;
  serviceStartTime?: Date | string | null;
  serviceEndTime?: Date | string | null;
}
