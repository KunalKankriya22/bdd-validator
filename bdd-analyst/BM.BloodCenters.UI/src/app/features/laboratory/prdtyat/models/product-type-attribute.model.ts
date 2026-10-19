export interface ProductTypeAttribute {
  anticoagulantCode: string;
  volume: number | null;
  productType: string;
  attributeGroup: string;
  attributeGroupDesc: string;
  attributeCode: string;
  attributeCodeDesc: string;
  productClass: string;
  modifierCode: string;
  effDate: string;
  termDate: string | null;
}

export interface CreateProductTypeAttributeDto {
  anticoagulantCode: string;
  volume: number | null;
  productType: string;
  attributeGroup: string;
  attributeCode: string;
  productClass: string;
  modifierCode: string;
  effDate: string;
  termDate?: string | null;
}

export interface UpdateProductTypeAttributeDto {
  attributeGroup: string;
  attributeCode: string;
  productClass: string;
  modifierCode: string;
  effDate?: string | null;
  termDate?: string | null;
}

export interface ProductTypeAttributeFilterValue {
  anticoagulantCode?: string | null;
  productType?: string | null;
  attribute?: string | null;
  effectiveDateFrom?: string | null;
  effectiveDateTo?: string | null;
  terminationDateFrom?: string | null;
  terminationDateTo?: string | null;
}

export interface ProductTypeAttributeParamsDto {
  searchKeyword?: string;
  anticoagulantCode?: string;
  productType?: string;
  attribute?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
}

export interface ProductTypeAttributeResponse {
  data: ProductTypeAttribute[];
  total: number;
  success?: boolean;
  message?: string;
}

export interface ProductTypeAttributeFormData {
  anticoagulantCode: string;
  volume: number | null;
  productType: string;
  attributeGroup: string;
  attributeCode: string;
  productClass: string;
  modifierCode: string;
  effDate: string;
  termDate: string | null;
}
