export interface OrderItemAttributeDto {
  attribGroup: string;
  attribCode: string;
  attribDesc?: string;
}

export interface RegularOrderDto {
  orderNo: string;
  chapterId: string;
  customerId: string;
  customerName?: string;
  orderType: string;
  orderClass: string;
  orderedBy?: string;
  contactId?: string;
  contractId?: string;
  priority?: string;
  orderMode?: string;
  consigneeId: string;
  consigneeName?: string;
  consigneeAddress?: string;
  payeeId: string;
  estArrivalTime?: string;
  orderStatus: string;
  insertDate: string;
  insertUserId: string;
  lastActivityDate: string;
  codFlag?: string;
  firstShipDate?: string;
  standingOrderFlag?: string;
  items: OrderItemDto[];
}

export interface OrderItemDto {
  orderNo: string;
  itemNo: number;
  productType: string;
  productTypeDesc?: string;
  bloodType: string;
  bloodTypeDesc?: string;
  tier: number;
  requiredQty: number;
  unitPrice?: number;
  itemStatus: string;
  allocatedQty: number;
  shippedQty: number;
  canceledQty?: number;
  subOk?: string;
  subQty?: number;
  attribGroup?: string;
  attribCode?: string;
  attribDesc?: string;
  attributes?: OrderItemAttributeDto[];
  noteId?: number;
}

export interface CreateRegularOrderRequestDto {
  customerId: string;
  orderType: string;
  orderClass: string;
  orderedBy?: string;
  contractId?: string;
  orderMode?: string;
  consigneeId: string;
  payeeId: string;
  estArrivalTime?: string;
  codFlag?: string;
  standingOrderFlag?: string;
  items: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  itemNo: number;
  productType: string;
  bloodType: string;
  bloodTypeDesc?: string;
  tier: number;
  requiredQty: number;
  unitPrice?: number;
  subOk?: string;
  attribGroup?: string;
  attribCode?: string;
  attributes?: OrderItemAttributeDto[];
}

export interface UpdateRegularOrderRequestDto {
  orderedBy?: string;
  orderMode?: string;
  consigneeId?: string;
  payeeId?: string;
  contractId?: string;
  estArrivalTime?: string;
  codFlag?: string;
  standingOrderFlag?: string;
  orderStatus?: string;
}

export interface RegularOrderQueryDto {
  customerId?: string;
  orderType?: string;
  orderClass?: string;
  orderStatus?: string;
  contractId?: string;
  insertDateFrom?: string;
  insertDateTo?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface LookupItem {
  code: string;
  description: string;
}

export interface CustomerContactDto {
  contactId: string;
  lastName: string;
  firstName: string;
  salutation?: string;
  title?: string;
  contactType?: string;
  contactTypeCode?: string;
  dayPhone?: string;
  faxNumber?: string;
  nightPhone?: string;
  telexNumber?: string;
  effectiveDate?: string;
  terminationDate?: string;
}

export interface ConsigneeDto {
  consigneeId: string;
  consigneeName: string;
  address?: string;
}

export interface InventoryTierDto {
  tier: number;
  from: number;
  to: number;
  days: string;
  stock: number;
  order: number;
  alloc: number;
  pack: number;
  avail: number;
}

export interface InventoryStockCheckResult {
  currentStock: number;
  minimal: number;
  optimal: number;
  requiredQty: number;
  warningLevel: 'none' | 'belowOptimal' | 'belowMinimal' | 'belowZero' | 'noStock';
  warningMessage: string;
}

export interface SpecialChargeDto {
  charge: string;
  code: string;
  creditDebit: string;
  quantity: number;
  amount: number;
}

export interface OpenOrderDto {
  orderNumber: string;
  item: number;
  product: string;
  abORh: string;
  quantityRequired: number;
  quantityShort: number;
  tierOrder: number;
  date: string;
  hours: number;
}

export interface OrderApiResponse<T> {
  data: T[];
  success: boolean;
  message: string;
  statusCode: number;
  total: number;
}

export interface CancelOrderRequestDto {
  cancelCode: string;
  note?: string;
}

export interface UpdateOrderItemRequestDto {
  productType?: string;
  bloodType?: string;
  bloodTypeDesc?: string;
  requiredQty?: number;
  subOk?: string;
  attribGroup?: string;
  attribCode?: string;
}

export interface OrderNumberLookupItem {
  orderNo: string;
  customerId?: string;
  customerName?: string;
  orderStatus?: string;
  insertDate?: string;
}

export interface PickSlipLookupItem {
  pickSlipId: string;
  pickSlipType?: string;
  pickSlipStatus?: string;
  insertDate?: string;
}

export interface OrderClassLookupItem {
  code: string;
  description: string;
  processHours?: number;
}

export interface ContractLookupItem {
  code: string;
  description: string;
  effDate?: string;
  substituteFlag?: string;
}

export interface StandingOrderItemDto {
  productType: string;
  bloodType?: string;
  bloodTypeDesc?: string;
  requiredQty: number;
  tier: number;
  subOk?: string;
}

export interface CreateConsigneeDto {
  consigneeId: string;
  name: string;
  shortName?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phoneNo?: string;
  faxNo?: string;
  effDate?: string;
  termDate?: string;
}
