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

export interface OrderSearchResultDto {
  orderNo: string;
  customerId: string;
  customerName?: string;
  orderDate?: string;
  orderStatus?: string;
}

export interface OrderHistoryDto {
  orderNo: string;
  orderedBy?: string;
  customerId: string;
  customerName?: string;
  priority?: string;
  type?: string;
  status?: string;
  estArrivalTime?: string;
  items: OrderItemDto[];
  history: OrderHistoryEntryDto[];
  orderNotes: OrderNoteDto[];
}

export interface OrderItemDto {
  itemNo: number;
  productType: string;
  aboRh?: string;
  required: number;
  allocated: number;
  canceled?: number;
  status?: string;
  hasNotes: boolean;
}

export interface OrderHistoryEntryDto {
  actionFunction?: string;
  dateTime: string;
  userName?: string;
}

export interface OrderNoteDto {
  note: string;
}

export interface OrderedAttributesAntigensDto {
  itemNo: number;
  attributes: OrderItemAttributeDto[];
  antigens: OrderItemAntigenDto[];
}

export interface OrderItemAttributeDto {
  group: string;
  code: string;
  description?: string;
  quantity?: number;
}

export interface OrderItemAntigenDto {
  id: string;
  description?: string;
}

export interface ShippedProductsDto {
  products: ShippedProductDto[];
}

export interface ShippedProductDto {
  unitId: string;
  product: string;
  abo?: string;
  expirationDate: string;
  shipment: string;
  price?: number;
  warehouseId?: string;
}

export interface ShippedAttributesAntigensDto {
  antigens: ShippedProductAntigenDto[];
  attributes: ShippedProductAttributeDto[];
}

export interface ShippedProductAntigenDto {
  unitId: string;
  product: string;
  testId: string;
  result: string;
}

export interface ShippedProductAttributeDto {
  unitId: string;
  product: string;
  attributeGroup: string;
  attributeCode: string;
}

export interface OrderedAttributesAntigensDialogData {
  itemNo: number;
  attributes: OrderItemAttributeDto[];
  antigens: OrderItemAntigenDto[];
}

export interface ShippedProductsDialogData {
  records: ShippedProductDto[];
}

export interface ShippedAttributesAntigensDialogData {
  antigens: ShippedProductAntigenDto[];
  attributes: ShippedProductAttributeDto[];
}
