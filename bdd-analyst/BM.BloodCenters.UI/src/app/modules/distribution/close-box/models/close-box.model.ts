export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errorCode?: string;
  errorResponse?: {
    errorCode?: string;
    error: string;
  };
}

export interface CloseBoxDto {
  boxId: string;
  boxType: string | null;
  boxTypeDescription: string | null;
  packedDate: string | null;
  packedBy: string | null;
  insertDate: string | null;
  boxStatus: string;
  boxStatusDescription: string;
  products: BoxProductDto[];
  productCount: number;
  estimatedArrivalTime?: string | null;
  shipTo?: string | null;
  address?: string | null;
  contact?: string | null;
  phone?: string | null;
}

export interface BoxProductDto {
  unitId: string;
  productCode: string;
  bloodType: string;
  aboDescription: string;
  expirationDate: string | null;
  collectionDate: string | null;
  checkDigit: string | null;
  pickSlipId: string;
  itemNo: number;
  productType: string | null;
}

export interface CloseBoxResultDto {
  boxId: string;
  status: string;
  message: string;
  productsProcessed: number;
}

export interface BoxProductTableRow {
  pickSlipId: string;
  itemNo: number;
  unitId: string;
  productType: string;
  product: string;
  orderedAboRh: string;
  expirationDate: string | null;
}

export interface AvailableBoxDto {
  boxId: string;
  orderNo: string | null;
  orderClass: string | null;
  estArrivalTime: string | null;
  consigneeName: string | null;
}

export interface BoxScanResultDto {
  boxId: string;
  isValid: boolean;
}
