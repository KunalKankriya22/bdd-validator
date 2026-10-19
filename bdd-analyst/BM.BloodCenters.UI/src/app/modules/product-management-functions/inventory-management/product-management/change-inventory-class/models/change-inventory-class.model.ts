export interface ChangeInventoryClassProductDto {
  unitId: string;
  productCode: string | null;
  productType: string | null;
  bloodType: string | null;
  bloodTypeDesc: string | null;
  aliquot: string | null;
  expDate: string | null;
  currentInvClass: string | null;
  locationId: string | null;
  collDate: string | null;
  warehouseId: string | null;
  locationRequired?: boolean;
}

export interface ChangeInventoryClassRequestDto {
  newClass: string;
  newLocation?: string | null;
  productCode?: string | null;
  aliquot?: string | null;
  collDate?: string | null;
  codeScheme?: string | null;
  warehouseId?: string | null;
  deviceType?: string | null;
  deviceNumber?: string | null;
  rackNumber?: string | null;
  trayNumber?: string | null;
  forceOverrideTrayFull?: boolean;
}

export interface DeviceDto {
  deviceId: string;
  deviceName: string;
  deviceType?: string | null;
}

export interface ChangeInventoryClassEntry {
  unitId: string;
  product: string;
  aboRh: string;
  expirationDate: string;
  collectionDate: string;
  currentClass: string;
  newClass: string;
  warehouseId: string;
  deviceNo: string;
  rackNo: string;
  trayNo: string;
}

export interface WarehouseDto {
  warehouseId: string;
  warehouseName: string;
}

export interface RackDto {
  rackId: string;
  rackName: string;
}

export interface TrayDto {
  trayId: string;
  trayName: string;
  itemCount: number;
}

export interface InventoryClassDto {
  code: string;
  description: string;
}

export interface ChangeInventoryClassApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  item?: T;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
  isWarning?: boolean;
}
