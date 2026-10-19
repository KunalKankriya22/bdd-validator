export type {
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  InventoryTierDto,
  InventoryStockCheckResult,
  SpecialChargeDto,
  OpenOrderDto,
  OrderApiResponse
} from '../../enter-regular-order/models/regular-order.model';

export interface SpecialOrderDto {
  orderNo: string;
  chapterId: string;
  customerId: string;
  customerName?: string;
  contractId?: string;
  orderedBy?: string;
  orderClass?: string;
  orderClassDesc?: string;
  orderMode?: string;
  orderModeDesc?: string;
  orderType?: string;
  orderTypeDesc?: string;
  consigneeId?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  payeeId?: string;
  payeeName?: string;
  payeeAddress?: string;
  orderStatus?: string;
  orderStatusDesc?: string;
  estArrivalTime?: string;
  codFlag?: string;
  firstShipDate?: string;
  insertDate: string;
  insertUserId: string;
  lastActivityDate?: string;
  noteId?: number;
  patientId?: string;
  patientAborh?: string;
  patientName?: string;
  doctorName?: string;
  notes?: string;
  priority?: string;
  items?: SpecialOrderItemDto[];
}

export interface SpecialOrderItemDto {
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
  antigenId?: string;
  antigenDesc?: string;
  sourceProductType?: string;
  sourceQty?: number;
}

export interface CreateSpecialOrderRequestDto {
  customerId: string;
  contractId: string;
  orderedBy: string;
  orderClass: string;
  orderMode: string;
  orderType: string;
  consigneeId: string;
  payeeId?: string;
  codFlag?: string;
  patientId?: string;
  patientAborh?: string;
  patientName: string;
  doctorName?: string;
  notes?: string;
}

export interface UpdateSpecialOrderRequestDto {
  orderedBy?: string;
  orderClass?: string;
  orderMode?: string;
  consigneeId?: string;
  payeeId?: string;
  codFlag?: string;
  orderStatus?: string;
  patientId?: string;
  patientAborh?: string;
  patientName?: string;
  doctorName?: string;
  notes?: string;
}

export interface CreateSpecialOrderItemDto {
  itemNo: number;
  productType: string;
  bloodType: string;
  tier: number;
  requiredQty: number;
  unitPrice?: number;
  subOk?: string;
  attribGroup?: string;
  attribCode?: string;
  antigenCode?: string;
  sourceProductType?: string;
  sourceQty?: number;
}

export interface PayeeDto {
  payeeId: string;
  payeeName: string;
  address: string;
}
