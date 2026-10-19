/**
 * SP' Antigen Group Models
 * Used for SP' Antigen Groups feature
 */

/**
 * Main SP Antigen Group model
 */
export interface SpAntigenGroup {
  testId: string;
  description: string;
  result: string;
  effDate: Date | string;
  termDate: Date | string | null;
  modificationDate: Date | string | null;
  auditKey?: number;
  antigenGroupCode?: string;
}

/**
 * DTO for creating a new antigen group
 */
export interface CreateSpAntigenGroupDto {
  antigenGroup: string;
  antigenRarity: string;
  testId: string;
  responsible: string;
  result: string;
  effDate: string;
  termDate: string | null;
  verificationDate: string | null;
}

/**
 * DTO for updating an existing antigen group
 */
export interface UpdateSpAntigenGroupDto {
  responsible?: string;
  result?: string;
  effDate?: string;
  termDate?: string | null;
  verificationDate?: string | null;
}

/**
 * API query parameters for searching/filtering antigen groups
 */
export interface SpAntigenGroupParamsDto {
  antigenGroup?: string;
  antigenRarity?: string;
  testId?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

/**
 * Dropdown option for Antigen Group
 */
export interface AntigenGroupDropdown {
  code: string;
  description: string;
}

/**
 * Dropdown option for Antigen Rarity
 */
export interface AntigenRarityDropdown {
  code: string;
  description: string;
}

/**
 * Generic lookup type for dropdowns
 */
export interface LookUp {
  key: string;
  value: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  statusCode: number;
  message: string;
}
