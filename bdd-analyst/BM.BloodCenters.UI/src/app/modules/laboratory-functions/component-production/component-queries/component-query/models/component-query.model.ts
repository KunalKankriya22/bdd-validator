export interface ComponentQuerySummaryDto {
  unitId: string;
  chapterId: string;
  collDate?: string;
  totalComponentBags: number;
  mainComponents: ComponentQueryDto[];
  convertedProducts: ConvertedProductDto[];
  attributes: ComponentAttributeDto[];
}

export interface ComponentQueryDto {
  unitId: string;
  chapterId: string;
  collDate: string;
  productCode: string;
  productDescription?: string;
  componentPrefix?: string;
  systemLabelDecision?: string;
  aboDescription?: string;
  expiryDate?: string;
  bagId?: string;
  relabelProductCode?: string;
  pooledComponentId?: string;
  bagsUsed?: number;
  componentWeight?: number;
  componentVolume?: number;
  componentCount?: number;
  componentStatus?: string;
  voidReasonCode?: string;
  rejectReasonCode?: string;
  labelDate?: string;
  outOfSystemDate?: string;
  insertDate?: string;
  labelUserId?: string;
  warehouseId?: string;
  uniqueRowId?: string;
}

export interface ConvertedProductDto extends ComponentQueryDto {}

export interface ComponentAttributeDto {
  unitId: string;
  chapterId: string;
  collDate: string;
  productCode: string;
  attribGroup?: string;
  attribCode?: string;
  attribGroupDescription?: string;
  attribCodeDescription?: string;
}

export interface ComponentInterdictionDto {
  unitId: string;
  chapterId: string;
  collDate: string;
  productCode: string;
  interCode: string;
  interDescription?: string;
  interType?: string;
  interTypeDescription?: string;
}

export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error?: string;
  errorCode?: string;
  statusCode: number;
  data: T[] | null;
  item?: T | null;
  total: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
