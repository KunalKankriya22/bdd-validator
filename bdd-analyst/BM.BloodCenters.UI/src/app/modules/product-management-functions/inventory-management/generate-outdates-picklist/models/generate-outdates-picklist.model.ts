export interface OutdatesSearchRequest {
  outdateAsOf: string;
  inventoryClass?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface OutdatesSummaryItem {
  productType: string;
  bloodType: string;
  bloodTypeDescription: string;
  quantity: number;
}

export interface OutdatesDetailRequest {
  outdateAsOf: string;
  productType: string;
  bloodType: string;
  inventoryClass?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface OutdatesDetailItem {
  unitId: string;
  chkDigit?: string;
  productCode: string;
  aliquot?: string;
  expirationDate: string;
  locationId: string;
  inventoryClass: string;
}

export interface OutdatesDetailResponse {
  items: OutdatesDetailItem[];
  totalRecords: number;
}

export interface InventoryClassOption {
  code: string;
  description?: string;
}

export interface CommitOutdatesRequest {
  outdateAsOf: string;
  inventoryClass?: string;
}

export interface CommitOutdatesResponse {
  pickSlipId: string;
  orderNo: string;
  productCount: number;
  reportJobId?: string;
  reportParmId?: string;
  reportStatus?: string;
  reportMessage?: string;
}
