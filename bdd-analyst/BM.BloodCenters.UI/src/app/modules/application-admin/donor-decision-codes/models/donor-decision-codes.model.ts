/**
 * Donor Decision Code Model
 * Represents a single barcode mapping to a donor decision code
 */
export interface DonorDecisionCodeModel {
  barCodeValue: string;
  donorDecisionCode: string;
  displayCode: string;
  effDate: Date | null;
  termDate?: Date | null;
  lastModifiedDate: Date | null;
  programId?: string;
}

/**
 * Request DTO for fetching Donor Decision Codes data
 */
export interface DonorDecisionCodeParamsDto {
  searchKeyword?: string;
  barcode?: string;
  donorDecisionCode?: string;
  effectiveDate?: string;
  effectiveDatePeriod?: string;
  terminationDate?: string;
  terminationDatePeriod?: string;
  sortColumn?: string;
  sort?: string;
}

/**
 * Filter Form Value Interface
 * Represents the structure of the filter panel form
 */
export interface DonorDecisionCodeFilterValue {
  barcode: string | null;
  donorDecisionCode: string | null;
  effectiveDatePeriod: 'After' | 'Before' | null;
  effectiveDate: Date | null;
  terminationDatePeriod: 'After' | 'Before' | null;
  terminationDate: Date | null;
}

/**
 * Donor Decision Code option for dropdown
 */
export interface DonorDecisionCodeOption {
  donorDecisionCode: string;
  description: string;
}

/**
 * Barcode option for dropdown
 */
export interface BarcodeOption {
  barCodeValue: string;
}

/**
 * DTO for Add Donor Decision Code
 */
export interface DonorDecisionCodeDto {
  barCodeValue: string;
  donorDecisionCode: string;
  effDate: string;
  termDate?: string | null;
}

/**
 * DTO for Update Donor Decision Code
 * Note: barCodeValue is sent as URL parameter, not in the request body
 */
export interface UpdateDonorDecisionCodeDto {
  donorDecisionCode: string;
  originalDonorDecisionCode: string;
  effDate: string;
  termDate?: string | null;
}

/**
 * Panel State Interface
 */
export interface DonorDecisionCodePanelState {
  isOpen: boolean;
  mode: 'add' | 'edit';
  data?: DonorDecisionCodeModel;
}
