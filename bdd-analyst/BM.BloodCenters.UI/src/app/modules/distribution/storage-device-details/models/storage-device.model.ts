export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string | null;
  statusCode: number;
  data: T[] | null;
  total: number;
}

export interface SaveResult {
  success: boolean;
  message: string;
  statusCode: number;
  item: boolean;
  errorResponse: { errorCode: string; error: string };
}

export interface StorageDeviceListDto {
  deviceType: string;
  deviceDescription: string;
  deviceNumber: string;
  deviceStatus: string;
  deviceStatusDescription: string;
  rackCount: number;
  installDate: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  lastTemperature: number | null;
  tempReadDate: string | null;
  effectiveDate: string;
  terminationDate: string | null;
  lastModifiedDate: string | null;
}

export interface StorageDeviceQueryDto {
  warehouseId: string;
  searchKeyword: string | null;
  sortColumn: string;
  sortOrder: string;
  filterDeviceType: string | null;
  filterStatusCode: string | null;
  filterEffectiveDateAfter: string | null;
  filterEffectiveDateBefore: string | null;
  filterTermDateAfter: string | null;
  filterTermDateBefore: string | null;
}

export interface CreateStorageDeviceDto {
  warehouseId: string;
  deviceType: string;
  deviceDescription: string;
  deviceNumber: string;
  deviceStatus: string;
  rackCount: number;
  installDate: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  lastTemperature: number | null;
  tempReadDate: string | null;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface UpdateStorageDeviceDto {
  warehouseId: string;
  deviceType: string;
  deviceDescription: string;
  deviceNumber: string;
  deviceStatus: string;
  rackCount: number;
  installDate: string | null;
  lastServiceDate: string | null;
  nextServiceDate: string | null;
  lastTemperature: number | null;
  tempReadDate: string | null;
  effectiveDate: string;
  terminationDate: string | null;
}

export interface StorageDeviceFilterValue {
  deviceType: string | null;
  statusCode: string | null;
  effectivePeriod: string | null;
  effectiveDate: string | null;
  terminationPeriod: string | null;
  terminationDate: string | null;
}

export interface LovOption {
  code: string;
  description: string;
}
