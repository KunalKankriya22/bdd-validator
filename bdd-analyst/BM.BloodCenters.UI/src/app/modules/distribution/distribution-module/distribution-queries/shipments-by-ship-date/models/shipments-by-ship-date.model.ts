export interface ShipmentDto {
  shipmentNo: string;
  shipmentDate: string | null;
  consigneeId: string | null;
  consigneeName: string | null;
  statusDesc: string | null;
  typeDesc: string | null;
  receiptDate: string | null;
  temperature: number | null;
  carrierDesc: string | null;
  flightNo: string | null;
  trackNo: string | null;
  noteId: number | null;
}

export interface ShipmentQueryDto {
  startDate: string;
  endDate?: string;
  shipmentNo?: string;
  status?: string;
  shipmentType?: string;
  dateReceived?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface BoxDetailDto {
  boxId: string;
  boxType: string | null;
  packedDate: string | null;
  packedBy: string | null;
  temperature: number | null;
  closedDate: string | null;
}

export interface OrderDetailDto {
  orderNo: string;
  orderStatusDesc: string | null;
}

export interface ShippedProductDetailDto {
  unitId: string;
  product: string | null;
  aboRh: string | null;
  expirationDate: string | null;
  inventoryClass: string | null;
  importFlag: string | null;
}

export interface DeliveryNotesDto {
  noteId: number;
  note: string | null;
}

export interface ShipmentSearchResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ShipmentDto[];
  total: number;
}

export interface ShipmentDetailResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface FilterState {
  status: string | null;
  shipmentType: string | null;
  dateReceived: string | null;
}

export interface LookupOption {
  code: string;
  description: string;
}

export interface FilterOptions {
  statuses: LookupOption[];
  types: LookupOption[];
}
