export interface ProductServiceCodeDto {
  productCode: string;
  productDesc: string;
  productType: string;
  invProductType: string;
  outOfStateFlag: string; // 'Y' or 'N'
  returnable: string; // 'Y' or 'N'
  stdPrice: number | null;
  serviceCode: string;
  lastModifiedDate?: Date;
  programId?: string;
}

export interface ProductServiceCodeQueryDto {
  searchKeyword?: string | null;
  invProductType?: string | null;
  serviceCode?: string | null;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface UpdateProductServiceCodeDto {
  serviceCode: string;
  stdPrice: number | null; // 0-9999999.99
}

export interface FilterValue {
  productCode?: string | null;
  productType?: string | null;
  invProductType?: string | null;
  serviceCode?: string | null;
}

export interface ProductCodeLOV {
  productCode: string;
  productDesc: string;
}

export interface InventoryProductTypeLOV {
  productType: string;
  productTypeDesc: string;
}

export interface ProductionProductTypeLOV {
  productType: string;
}

export interface ServiceCodeLOV {
  serviceCode: string;
}
