/**
 * Models for Associate Letter to Interdiction feature
 */

/**
 * Main data model for letter-interdiction association
 */
export interface LetterInterdictionAssociation {
  interdictionCode: string;
  interdictionDescription?: string;
  donationType: string;
  donationDescription?: string;
  letterId: string;
  effectiveDate: string;
  terminationDate?: string | null;
  totalCount?: number;
}

/**
 * Filter criteria for searching associations
 */
export interface AssociationFilterCriteria {
  interdictionCode?: string;
  donationType?: string;
  letterId?: string;
}

/**
 * Dropdown option for interdiction codes
 */
export interface InterdictionCodeOption {
  code: string;
  description: string;
}

/**
 * Dropdown option for donation types
 */
export interface DonationTypeOption {
  code: string;
  description: string;
}

/**
 * Dropdown option for letter codes
 */
export interface LetterCodeOption {
  letterId: string;
  code: string;
  description?: string;
}

/**
 * Request model for creating association
 */
export interface CreateAssociationRequest {
  interdictionCode: string;
  donationType: string;
  letterId: string;
  effectiveDate: string;
  terminationDate?: string;
}

/**
 * Request model for updating association
 */
export interface UpdateAssociationRequest {
  terminationDate: string;
}

/**
 * Response wrapper for list operations
 */
export interface AssociationListResponse {
  data: LetterInterdictionAssociation[];
  totalCount: number;
}

/**
 * Dropdown data response
 */
export interface DropdownDataResponse {
  interdictionCodes: InterdictionCodeOption[];
  donationTypes: DonationTypeOption[];
  letterCodes: LetterCodeOption[];
}
