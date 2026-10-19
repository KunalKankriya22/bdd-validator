// ─── Grid / CRUD DTOs ────────────────────────────────────────────────────────

export interface OutdatedProductDto {
  productId: string;
  productCode: string;
  productType: string | null;
  expirationDate: string | null;
  discardCode: string | null;
  discardDescription: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  pickSlipId: string | null;
  moveDate: string | null;
  status: string | null;
  insertDate: string;
  insertUser: string;
  aboRh?: string | null;
}

export interface OutdatedProductQueryDto {
  productId?: string | null;
  productCode?: string | null;
  pickSlipId?: string | null;
  warehouseId?: string | null;
  discardCode?: string | null;
  status?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  expirationFromDate?: string | null;
  expirationToDate?: string | null;
  searchKeyword?: string | null;
  sortColumn?: string | null;
  sortOrder?: string | null;
}

export interface MoveProductToOutdateRequestDto {
  productId: string;
  productCode: string;
  productType?: string | null;
  pickSlipId?: string | null;
  discardCode: string;
  warehouseId: string;
  expirationDate?: string | null;
  moveDate: string;
}

export interface MoveProductToOutdateResponseDto {
  productId: string;
  productCode: string;
  warehouseId: string;
  discardCode: string;
  moveDate: string;
  pickSlipClosed?: boolean;
}

export interface OutdatedProductListResponse {
  data: OutdatedProductDto[];
  total: number;
}

// ─── Lookup / Dropdown DTOs ───────────────────────────────────────────────────

export interface WarehouseDto {
  warehouseId: string;
  warehouseName: string;
}

export interface DiscardCodeDto {
  discardCode: string;
  description: string;
}

export interface PickSlipDto {
  pickSlipId: string;
  dateTime: string;
  totalProducts: number;
}

export interface PickSlipProductDto {
  unitId: string;
  product: string;
  checkDigit: string;
  status: string;
}

// ─── Pick Slip API Response DTOs ──────────────────────────────────────────────

export interface PickSlipApiDto {
  pickSlipId: string;
  dateAndTime: string;
  totalProduct: number;
}

export interface PickSlipProductApiDto {
  productId: string;
  unitId: string;
  productType: string;
  aboRh: string;
  expirationDateTime: string;
  checkDigit: string;
}

export interface ProductDropdownDto {
  productId: string;
  productType: string;
}

// ─── Scanned Product (UI Session) ─────────────────────────────────────────────

export interface ScannedProduct {
  unitId: string;
  productCode: string;
  productType: string;
  aboRh: string;
  expirationDate: string;
  scannedAt: Date;
}

// ─── Generic API wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
