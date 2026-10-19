export interface DiscardUnitVerifyResponse {
  unitId: string;
  collDate: string;
}

export interface ProductCodeItem {
  productCode: string;
  productType: string;
}

export interface AboTypeResponse {
  aliquot: string | null;
  aliquotOptions: string[] | null;
  aboTypes: AboTypeItem[];
  isPool: boolean;
}

export interface AboTypeItem {
  bloodType: string;
  aboDesc: string;
  expDate: string | null;
}

export interface LocationDefaultsResponse {
  storageClass: string;
  inventoryClass: string;
  defaultWarehouseId: string;
  defaultDeviceNumber: string;
  defaultDeviceType: string;
  defaultRackNumber: string;
  warehouses: WarehouseItem[];
  devices: DeviceItem[];
  racks: RackItem[];
}

export interface WarehouseItem {
  warehouseId: string;
  description: string;
}

export interface DeviceItem {
  deviceNumber: string;
  deviceType: string;
  description: string;
}

export interface RackItem {
  rackNumber: string;
  description: string;
}

export interface TrayItem {
  trayNumber: string;
  shelfNumber: string;
}

export interface CheckinProductRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  warehouseId: string;
  deviceNumber: string;
  deviceType: string;
  rackNumber: string;
  shelfNumber: string;
  trayNumber: string;
  forceExpired: boolean;
  forceOverCapacity: boolean;
}

export interface CheckedInProduct {
  unitId: string;
  collDate: string;
  productCode: string;
  aboRh: string;
  expirationDate: string;
  warehouseId: string;
  deviceNumber: string;
  rackNumber: string;
  trayNumber: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  statusCode: number;
  data?: T;
  item?: T;
  errorCode?: string | null;
  errorResponse?: {
    error: string;
    errorCode: string;
    isWarning?: boolean;
  };
}
