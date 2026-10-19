export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total: number;
}

export interface RackDetailListDto {
  rackNumber: string;
  rackDescription: string;
  productType: string;
  bloodType: string | null;
  bloodTypeDescription: string | null;
  shelfCount: number | null;
  trayCount: number | null;
  mixProduct: string | null;
  mixAbo: string | null;
  effectiveDate: string;
  terminationDate: string | null;
  lastModifiedDate: string | null;
}

export interface RackDetailQueryDto {
  warehouseId: string;
  deviceType: string;
  deviceNumber: string;
  storageClass: string;
  searchKeyword: string | null;
  sortColumn: string;
  sortOrder: string;
  filterRackNumber: string | null;
  filterProductType: string | null;
  filterEffectiveDateAfter: string | null;
  filterEffectiveDateBefore: string | null;
  filterTermDateAfter: string | null;
  filterTermDateBefore: string | null;
}

export interface CreateRackDetailDto {
  warehouseId: string;
  deviceType: string;
  deviceNumber: string;
  storageClass: string;
  rackNumber: string;
  rackDescription: string;
  productType: string;
  bloodType: string | null;
  shelfCount: number | null;
  trayCount: number | null;
  mixProduct: string | null;
  mixAbo: string | null;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface UpdateRackDetailDto {
  warehouseId: string;
  deviceType: string;
  deviceNumber: string;
  storageClass: string;
  rackNumber: string;
  rackDescription: string;
  productType: string;
  bloodType: string | null;
  shelfCount: number | null;
  trayCount: number | null;
  mixProduct: string | null;
  mixAbo: string | null;
  effectiveDate: string;
  terminationDate: string | null;
  originalRackNumber: string;
  originalProductType: string;
  originalBloodType: string | null;
}

export interface RackDefinitionFilterValue {
  rackNumber: string | null;
  productType: string | null;
  effectivePeriod: string | null;
  effectiveDate: string | null;
  terminationPeriod: string | null;
  terminationDate: string | null;
}

export interface LovOption {
  code: string;
  description: string;
}
