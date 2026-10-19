/**
 * Models for Auto/Dir Products Query Module
 * Based on API Documentation: /api/auto-dir-products
 */

/**
 * Search request DTO for filtering Auto/Dir products
 * All fields are optional, but at least one search criterion is required
 */
export interface AutoDirProductsSearchRequestDto {
  unitId?: string;          // Unit ID (exact match) - max 15 chars
  fromDate?: string;        // Collection date from (YYYY-MM-DD format for API)
  toDate?: string;          // Collection date to (YYYY-MM-DD format for API)
  needByDate?: string;      // Date needed by (YYYY-MM-DD format for API)
  surgeryDate?: string;     // Surgery date (YYYY-MM-DD format for API)
  hospitalId?: string;      // Hospital ID - max 10 chars
  patientId?: string;       // Patient ID - max 50 chars
  orderBy?: 'UNIT' | 'COLL'; // Sort order: "UNIT" (unit_id, coll_date) or "COLL" (coll_date, unit_id)
  take?: number;            // Pagination page size (1-100, default: 50)
  skip?: number;            // Pagination offset (>= 0, default: 0)
}

/**
 * Component DTO - represents a product component
 */
export interface AutoDirProductsComponentDto {
  productType?: string;       // Product type/SLD
  productCode: string;        // Product code (required)
  productDescription?: string; // Product description
  expiryDate?: Date;          // Expiry date
  shipProduct?: string;       // Ship indicator (Y/N)
}

/**
 * Unit DTO - represents a unit from Auto/Dir donations
 */
export interface AutoDirProductsUnitDto {
  unitId: string;                             // Unit identifier (required)
  checkDigit?: string;                        // Check digit for validation
  collectionDate: Date;                       // Collection date (required)
  donorDecisionDisplay: string;               // "AU" (Autologous) or "DI" (Directed) - required
  patientId?: string;                         // Patient identifier
  patientName?: string;                       // Patient name formatted as "Last, First"
  hospitalId?: string;                        // Hospital/Customer ID
  hospitalShortName?: string;                 // Hospital short name
  needByDate?: Date;                          // Date product needed by
  surgeryDate?: Date;                         // Surgery date
  surgeryId?: string;                         // Surgery identifier
  comments?: string;                          // Transfer/transfusion comments
  productTypes: string[];                     // Array of product types for directed donors
  components: AutoDirProductsComponentDto[];  // Array of product components
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}

/**
 * Search response structure
 */
export interface AutoDirProductsSearchResponse {
  data: AutoDirProductsUnitDto[];
  total: number;
}

/**
 * Filter form model for UI
 */
export interface AutoDirProductsFilterForm {
  unitId: string | null;
  fromDate: Date | null;
  toDate: Date | null;
  needByDate: Date | null;
  surgeryDate: Date | null;
  hospitalId: string | null;
  patientId: string | null;
  orderBy: 'UNIT' | 'COLL';
}

/**
 * Active filter chip model
 */
export interface FilterChip {
  key: string;
  label: string;
  value: string;
  removable: boolean;
}

/**
 * Sort order options
 */
export interface SortOrderOption {
  value: 'UNIT' | 'COLL';
  label: string;
}

/**
 * Sort order options constant
 */
export const SORT_ORDER_OPTIONS: SortOrderOption[] = [
  { value: 'UNIT', label: 'Unit ID, Collection Date' },
  { value: 'COLL', label: 'Collection Date, Unit ID' }
];

/**
 * Hospital lookup DTO
 */
export interface HospitalLookupDto {
  hospitalId: string;
  hospitalName: string;
}

/**
 * Patient lookup DTO
 */
export interface PatientLookupDto {
  patientId: string;
  patientName: string;
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 50;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
