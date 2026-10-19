// ===========================
// Response DTOs (from API)
// ===========================

export interface PickSlipDropdownDto {
  pickSlipId: string;
  insertDate: string;
  productCount: number;
}

export interface PickSlipSummaryDto {
  pickSlipId: string;
  insertDate: string;
  totalProducts: number;
  outdateProducts: number;
  cancelledProducts: number;
  pickSlipStatus: 'OP' | 'CL';
}

export interface PickSlipProductDto {
  unitId: string;
  checkDigit: string | null;
  productCode: string;
  productType: string;
  productDescription: string;
  aboRh: string;
  expirationDate: string;
  productStatus: 'OD' | 'CA';
  productStatusDescription: string;
  aliquot: string | null;
  bloodType: string;
  collectionDate: string | null;
}

// ===========================
// Request DTOs (to API)
// ===========================

export interface RemoveProductRequestDto {
  pickSlipId: string;
  unitId: string;
  productCode: string;
  aliquot?: string;
  codeScheme?: string;
}

// ===========================
// Response DTOs (from API)
// ===========================

export interface ProductRemovalResultDto {
  unitId: string;
  productCode: string;
  productType: string;
  aboRh: string;
  expirationDate: string;
  pickSlipAutoClosed: boolean;
  message: string;
}

// ===========================
// API Response Wrapper
// ===========================

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  item?: T;
  total?: number;
  errorCode?: number;
}

// ===========================
// UI Models (for component state)
// ===========================

export interface RemovedProductModel {
  unitId: string;
  checkDigit: string | null;
  productCode: string;
  productDescription: string;
  aboRh: string;
  expirationDate: string;
}

export interface EligibleProductOption {
  productCode: string;
  productDescription: string;
  aboRh: string;
  expirationDate: string;
}

// ===========================
// Error Code Mappings
// ===========================

export const ODTOFF_ERROR_CODES: Record<number, string> = {
  3300: 'Invalid pick slip ID or pick slip is not open for outdate products',
  5901: 'No outdate products remaining on pick slip',
  312: 'Unit ID not found in system for this chapter',
  3702: 'Unit not on pick slip or not expired with OD status',
  309: 'Invalid product code',
  9803: 'Product code must be 8 characters',
  9804: 'Product code must be 5 characters',
  3301: 'Product not on pick slip for this unit',
  6300: 'Product already discarded',
  600: 'Transaction commit failed',
};
