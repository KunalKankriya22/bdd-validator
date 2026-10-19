export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
}

export interface StandingOrderSearchRequest {
  weekDay?: string;
  customerType?: string;
  customerId?: string;
}

export interface StandingOrderDto {
  customerName: string;
  weekDay: string;
  weekDayFull: string;
  contractId: string;
  consigneeId: string;
  effDate: string;
  termDate: string | null;
  chapterId: string;
  items: StandingOrderItemDto[];
}

export interface StandingOrderItemDto {
  itemNo: number;
  weekDay: string;
  weekDayFull: string;
  productType: string;
  productName: string;
  aboRh: string;
  tier: number | null;
  qty: number;
  minQty: number | null;
  effDate: string;
  termDate: string | null;
  attributes: StandingOrderAttributeDto[];
}

export interface StandingOrderAttributeDto {
  attributeGroup: string;
  attributeCode: string;
  attributeDescription: string;
}

export interface WeekDayLookup {
  code: string;
  name: string;
  dayNumber: number;
}

export interface CustomerTypeLookup {
  code: string;
  description: string;
}

export interface CustomerLookup {
  customerId: string;
  customerName: string;
  customerType: string;
}
