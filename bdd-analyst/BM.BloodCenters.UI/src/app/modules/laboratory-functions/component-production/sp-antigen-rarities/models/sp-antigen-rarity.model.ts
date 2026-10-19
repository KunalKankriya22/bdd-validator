/**
 * SP' Antigen Rarity Models
 * Used for SP' Antigen Rarities feature
 */

/**
 * Main SP Antigen Rarity model
 */
export interface SpAntigenRarity {
  rarityCode: string;
  rarityDescription: string;
  effDate: Date | string;
  termDate: Date | string | null;
  auditKey?: number;
  lastModifiedDate?: Date | string;
}

/**
 * DTO for creating a new antigen rarity
 */
export interface CreateSpAntigenRarityDto {
  rarityCode: string;
  rarityDescription: string;
  effDate: string;
  termDate: string | null;
}

/**
 * DTO for updating an existing antigen rarity
 */
export interface UpdateSpAntigenRarityDto {
  rarityDescription?: string;
  effDate?: string;
  termDate?: string | null;
}

/**
 * API query parameters for searching/filtering antigen rarities
 */
export interface SpAntigenRarityParamsDto {
  rarityCode?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
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
