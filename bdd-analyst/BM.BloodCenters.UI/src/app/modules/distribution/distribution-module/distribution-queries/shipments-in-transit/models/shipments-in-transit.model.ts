export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface ShipmentLookupDto {
  shipmentNo: string;
  consigneeName: string;
}

export interface BoxLookupDto {
  boxId: string;
}

export interface ShipmentsInTransitSearchRequest {
  ShipmentNo: string;
  BoxId?: string | null;
  pageNumber?: number;
  pageSize?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ShipmentProductDto {
  unitId: string;
  checkDigit: string | null;
  productCode: string;
  productDescription: string;
  aliquot: string | null;
  aboRh: string;
  expirationDate: string | null;
}

export interface ShipmentHeaderDto {
  shipmentNo: string;
  shipmentDate: string;
  carrierCode: string;
  carrierName: string;
  customerName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  totalBoxes: number;
  defaultBoxId: string | null;
  products: ShipmentProductDto[];
  totalProductCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface ShipmentProductDisplay extends ShipmentProductDto {
  fullUnitId: string;
  formattedExpirationDate: string;
}
