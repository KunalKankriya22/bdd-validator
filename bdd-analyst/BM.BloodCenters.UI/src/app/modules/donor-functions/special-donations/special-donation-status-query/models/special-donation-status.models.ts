/**
 * Special Donation Status Query Models
 * Based on API documentation: SpecialDonationStatusQuery.md
 */

// ============================================================================
// Generic API Response Wrapper
// ============================================================================

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  page?: number;
  pageSize?: number;
}

// ============================================================================
// Request DTOs
// ============================================================================

/**
 * Query criteria for special donation status search
 */
export interface SpecialDonationStatusQueryDto {
  fromDate?: Date | string;              // Collection date range start
  toDate?: Date | string;                // Collection date range end
  shipId?: string;                       // Ship location ID (max 10 chars, partial match)
  patId?: string;                        // Patient ID (max 10 chars, partial match)
  shipStatus?: 'A' | 'S' | 'N';         // 'A' (All), 'S' (Shipped), 'N' (Not Shipped). Default: 'A'
  unitId?: string;                       // Unit ID - 7 chars (Codabar) or 15 chars (ISBT)
  surgId?: string;                       // Surgery ID (max 10 chars)
  dateNeededBy?: Date | string;          // Date needed by
  sortColumn?: string;                   // Sort column name
  sortDirection?: 'ASC' | 'DESC';        // Sort direction
}

// ============================================================================
// Response DTOs
// ============================================================================

/**
 * Response wrapper for special donation status query
 */
export interface SpecialDonationStatusResponseDto {
  specialUnits: SpecialUnitDto[];
  totalRecordsFound: number;
}

/**
 * Master record representing a special unit
 */
export interface SpecialUnitDto {
  sequence: number;                      // Record sequence number
  shipId?: string;                       // Ship location ID
  shipDesc?: string;                     // Ship location description (initcap)
  unitId: string;                        // Unit ID (base, without check digit)
  displayUnitId: string;                 // Unit ID with check digit (for ISBT)
  patientName?: string;                  // Patient name (Last, First)
  collDate: Date | string;               // Collection date
  donationType?: string;                 // Donation type
  patId: string;                         // Patient ID
  surgId?: string;                       // Surgery ID
  surgDate?: string;                     // Surgery date (MM-DD-YYYY)
  surgDay?: string;                      // Surgery day of week (e.g., 'WED')
  dateNeededBy?: Date | string;          // Date needed by
  seqNo: number;                         // Sequence number
  shippedProducts?: ShippedProductDto[]; // Child: Shipped products
  directedDonor?: DirectedDonorDto;      // Child: Directed donor info
}

/**
 * Detail record representing a shipped product
 */
export interface ShippedProductDto {
  unitId: string;                        // Unit ID (base, without check digit)
  displayUnitId: string;                 // Unit ID with check digit (for ISBT)
  productCode: string;                   // Product code
  productType?: string;                  // Product type description
  shippedDate: Date | string;            // Date shipped
}

/**
 * Detail record representing directed donor information
 */
export interface DirectedDonorDto {
  patId: string;                         // Patient ID
  seqNo: number;                         // Sequence number
  prodType1?: string;                    // Product type 1
  prodType2?: string;                    // Product type 2
  prodType3?: string;                    // Product type 3
}

// ============================================================================
// Lookup DTOs
// ============================================================================

/**
 * Ship location lookup item for dropdown
 */
export interface ShipLocationLookupDto {
  shipId: string;                        // Ship location ID
  shipDesc: string;                      // Ship location description
  displayValue: string;                  // Display value (ID - Description)
}

/**
 * Patient lookup item for dropdown
 */
export interface PatientLookupDto {
  patId: string;                         // Patient ID
  patientName: string;                   // Patient name (Last, First)
  displayValue: string;                  // Display value (ID - Name)
}

/**
 * Unit ID lookup item for dropdown
 */
export interface UnitIdLookupDto {
  unitId: string;                        // Unit ID (base, without check digit)
  patientName: string;                   // Patient name (LastName, FirstName)
  displayValue: string;                  // Unit ID - Patient Name
}

/**
 * Surgery ID lookup item for dropdown
 */
export interface SurgIdLookupDto {
  surgId: string;                        // Surgery ID
  patientName: string;                   // Patient name (LastName, FirstName)
  displayValue: string;                  // Surgery ID - Patient Name
}

// ============================================================================
// Filter Criteria (Component State)
// ============================================================================

/**
 * Filter criteria for the component
 */
export interface FilterCriteria {
  fromDate: string;
  toDate: string;
  shipLocation: string;
  patientId: string;
  details: string;
  option: 'All Units' | 'Shipped' | 'Not Shipped';
  unitId: string;
  surgeryId: string;
  needBy: string;
}

// ============================================================================
// Legacy Models (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use SpecialUnitDto instead
 */
export interface SpecialDonation {
  id: string;
  sequence: number;
  shipLocation: string;
  patient: string;
  patientId: string;
  unitId: string;
  collectionDate: string;
  donationType: string;
  surgeryId: string;
  surgeryDate: string;
  surgeryDay: string;
  dateNeeded: string;
  components: DonationComponent[];
}

/**
 * @deprecated Use ShippedProductDto instead
 */
export interface DonationComponent {
  type: string;
  product: string;
  shipDate: string;
  componentsMade?: string;
  componentsRequested?: string;
  unitId?: string;
  productCode?: string;
  shippedDate?: string;
}
