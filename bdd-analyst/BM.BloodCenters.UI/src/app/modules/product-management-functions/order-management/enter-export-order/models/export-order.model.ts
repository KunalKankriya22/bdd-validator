import type { OrderItemAttributeDto as _OrderItemAttributeDto } from '../../enter-regular-order/models/regular-order.model';

export type {
  LookupItem,
  ConsigneeDto,
  CustomerContactDto,
  InventoryTierDto,
  InventoryStockCheckResult,
  SpecialChargeDto,
  OpenOrderDto,
  OrderApiResponse,
  OrderItemAttributeDto
} from '../../enter-regular-order/models/regular-order.model';

type OrderItemAttributeDto = _OrderItemAttributeDto;

export interface ExportOrderDto {
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
  priority?: string;
  items?: ExportOrderItemDto[];
}

export interface ExportOrderItemDto {
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
}

export interface CreateExportOrderRequestDto {
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
  items: CreateExportOrderItemDto[];
}

export interface UpdateExportOrderRequestDto {
  orderedBy?: string;
  orderMode?: string;
  consigneeId?: string;
  payeeId?: string;
  contractId?: string;
  estArrivalTime?: string;
  codFlag?: string;
  orderStatus?: string;
}

export interface CreateExportOrderItemDto {
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

export interface OrderClassLookupItem {
  code: string;
  description: string;
  processHours: number | null;
}

export interface ContractLookupItem {
  code: string;
  description: string;
  substituteFlag: string | null;
}

export interface PayeeLookupItem {
  code: string;
  description: string;
  address: string;
}

export interface StandingOrderItemDto {
  productType: string;
  productTypeDesc: string;
  bloodType: string;
  bloodTypeDesc: string;
  tier: number;
  requiredQty: number;
  subOk: string;
  attribGroup: string;
  attribCode: string;
}
