/**
 * Vehicle Type item returned from API
 */
export interface VehicleTypeItem {
  code: string;
}

/**
 * API response for vehicle types
 */
export interface VehicleTypesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: VehicleTypeItem[];
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Vehicle ID item returned from API
 */
export interface VehicleIdItem {
  code: string;
  description: string;
}

/**
 * API response for vehicle IDs
 */
export interface VehicleIdsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: VehicleIdItem[];
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

/**
 * Date filter period type
 */
export type DatePeriod = 'Before' | 'After';

/**
 * VehicleNote - Individual note attached to a vehicle
 */
export interface VehicleNote {
  noteId: string;
  chapterId: string;
  noteSequence: number;
  note: string;
  programId: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
}

/**
 * Request body for creating/updating a note
 */
export interface CreateUpdateVehicleNote {
  chapterId: string;
  noteSequence: number;
  note: string;
}

/**
 * Note structure for creating a new vehicle with notes
 */
export interface CreateVehicleNotePayload {
  chapterId: string;
  note: string;
}

/**
 * VehicleDetails - Main vehicle record
 */
export interface VehicleDetails {
  vehicleId: string;
  vehicleName: string;
  vehicleType: string;
  identificationNumber?: string;
  licensePlate?: string;
  registrationDate?: string;  // ISO UTC
  commissionDate?: string;  // ISO UTC
  decommissionDate?: string;  // ISO UTC
  fdaLicenseDate?: string;  // ISO UTC
  fdaRenewalDate?: string;  // ISO UTC
  lastInspectionDate?: string;  // ISO UTC
  inspectionRenewalDate?: string;  // ISO UTC
  effectiveDate: string;  // ISO UTC (required)
  terminationDate?: string;  // ISO UTC
  notes?: VehicleNote[];
}

/**
 * Request body for list endpoint
 * All fields optional
 */
export interface VehicleDetailsFilter {
  searchText?: string;
  vehicleId?: string;
  vehicleType?: string;
  showTerminated?: boolean;
  chapterLocalDate?: string;  // YYYY-MM-DD — chapter's local date for active/terminated logic
  effDate?: string;  // ISO date
  effDatePeriod?: DatePeriod;
  termDate?: string;
  termDatePeriod?: DatePeriod;
  sortDirection?: string;  // "ASC" or "DESC"
  sort?: string;  // "vehicleId_asc", "vehicleName_desc"
}

/**
 * Generic API response wrapper
 */
export interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  total?: number;
}

/**
 * Single item API response wrapper
 */
export interface SingleReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T;
}

/**
 * List response wrapper
 */
export interface VehicleDetailsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: VehicleDetails[];
  total: number;
}

/**
 * Request body for adding a new vehicle
 */
export interface CreateVehicleDetails {
  vehicleName: string;  // required, max 50
  vehicleType: string;  // required, max 5
  identificationNumber: string | null;
  licensePlate: string | null;
  registrationDate: string | null;
  commissionDate: string | null;
  decommissionDate: string | null;
  fdaLicenseDate: string | null;
  fdaRenewalDate: string | null;
  lastInspectionDate: string | null;
  inspectionRenewalDate: string | null;
  effectiveDate: string;  // required
  terminationDate: string | null;
  notes?: CreateVehicleNotePayload[];
}

/**
 * Request body for updating a vehicle
 */
export interface UpdateVehicleDetails {
  vehicleId: string;
  vehicleName: string;
  vehicleType: string;
  identificationNumber: string | null;
  licensePlate: string | null;
  registrationDate: string | null;
  commissionDate: string | null;
  decommissionDate: string | null;
  fdaLicenseDate: string | null;
  fdaRenewalDate: string | null;
  lastInspectionDate: string | null;
  inspectionRenewalDate: string | null;
  effectiveDate: string;
  terminationDate: string | null;
}

/**
 * Filter panel form value interface
 */
export interface VehicleDetailsFilterValue {
  vehicleId: string | null;
  vehicleType: string | null;
  showTerminated: boolean;
  effectiveDate: string | null;
  effectiveDatePeriod: DatePeriod | null;
  terminationDate: string | null;
  terminationDatePeriod: DatePeriod | null;
}
