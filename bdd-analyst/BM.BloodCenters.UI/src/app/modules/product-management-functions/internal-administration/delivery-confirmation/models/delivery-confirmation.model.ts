export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total: number | null;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface UndeliveredShipmentDto {
  shipmentNo: string;
  shortName: string;
  consigneeName: string;
}

export interface ShipmentDeliveryDto {
  shipmentNo: string;
  consigneeId: string | null;
  consigneeShortName: string | null;
  shipmentDate: string | null;
  shippedByPerson: string | null;
  carrier: string | null;
  trackNo: string | null;
  flightNo: string | null;
  receiptDate: string | null;
  receivedBy: string | null;
  comments: string | null;
  chapterId: string;
}

export interface ConfirmDeliveryRequestDto {
  shipmentNo: string;
  receiptDate: string;
  receiptTime?: string;
  receivedBy: string;
  comments?: string;
}
